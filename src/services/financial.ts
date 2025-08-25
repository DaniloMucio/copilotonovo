import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp
} from 'firebase/firestore';

// Tipos para dados financeiros
export interface FinancialTransaction {
  id?: string;
  userId: string;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
  km?: number;
  hours?: number;
  fuel?: number;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averagePerHour: number;
  averagePerKm: number;
  fuelEfficiency: number;
  profitMargin: number;
  transactionCount: number;
}

// Buscar transações financeiras do usuário
export async function getUserTransactions(
  userId: string, 
  startDate?: Date, 
  endDate?: Date,
  type?: 'revenue' | 'expense'
): Promise<FinancialTransaction[]> {
  try {
    // Query simplificada sem orderBy para evitar necessidade de índice composto
    let q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    );

    // Filtrar por tipo se especificado
    if (type) {
      q = query(q, where('type', '==', type));
    }

    // Filtrar por período se especificado (temporariamente desabilitado para evitar índices compostos)
    // if (startDate && endDate) {
    //   q = query(
    //     q,
    //     where('date', '>=', startDate),
    //     where('date', '<=', endDate)
    //   );
    // }

    const querySnapshot = await getDocs(q);
    const transactions: FinancialTransaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Verificar se os campos de data existem antes de chamar toDate()
      const transaction = {
        id: doc.id,
        ...data,
        date: data.date ? data.date.toDate() : new Date(),
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      } as FinancialTransaction;
      
      transactions.push(transaction);
    });

    // Ordenar em memória para evitar necessidade de índice composto
    let filteredTransactions = transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Filtrar por período em memória se especificado
    if (startDate && endDate) {
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = transaction.date.getTime();
        return transactionDate >= startDate.getTime() && transactionDate <= endDate.getTime();
      });
    }
    
    return filteredTransactions;
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    throw new Error('Falha ao carregar dados financeiros');
  }
}

// Buscar transações dos últimos N dias
export async function getRecentTransactions(
  userId: string, 
  days: number
): Promise<FinancialTransaction[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getUserTransactions(userId, startDate, endDate);
}

// Buscar transações por período específico
export async function getTransactionsByPeriod(
  userId: string,
  period: 'day' | 'week' | 'month' | 'year'
): Promise<FinancialTransaction[]> {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Segunda-feira
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  return getUserTransactions(userId, startDate, endDate);
}

// Calcular métricas financeiras
export async function calculateFinancialMetrics(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<FinancialMetrics> {
  try {
    const transactions = await getUserTransactions(userId, startDate, endDate);
    
    const revenueTransactions = transactions.filter(t => t.type === 'revenue');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    // Calcular métricas baseadas em horas e KM
    const totalHours = transactions.reduce((sum, t) => sum + (t.hours || 0), 0);
    const totalKm = transactions.reduce((sum, t) => sum + (t.km || 0), 0);
    const totalFuel = transactions.reduce((sum, t) => sum + (t.fuel || 0), 0);
    
    const averagePerHour = totalHours > 0 ? netProfit / totalHours : 0;
    const averagePerKm = totalKm > 0 ? netProfit / totalKm : 0;
    const fuelEfficiency = totalFuel > 0 ? totalKm / totalFuel : 0;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      averagePerHour,
      averagePerKm,
      fuelEfficiency,
      profitMargin,
      transactionCount: transactions.length
    };
  } catch (error) {
    console.error('Erro ao calcular métricas:', error);
    throw new Error('Falha ao calcular métricas financeiras');
  }
}

// Adicionar nova transação
export async function addTransaction(
  transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = new Date();
    const transactionData = {
      ...transaction,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'transactions'), transactionData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar transação:', error);
    throw new Error('Falha ao salvar transação');
  }
}

// Atualizar transação existente
export async function updateTransaction(
  transactionId: string,
  updates: Partial<FinancialTransaction>
): Promise<void> {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    await updateDoc(transactionRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    throw new Error('Falha ao atualizar transação');
  }
}

// Excluir transação
export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    await deleteDoc(transactionRef);
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    throw new Error('Falha ao excluir transação');
  }
}

// Buscar categorias de transações
export async function getTransactionCategories(): Promise<string[]> {
  try {
    const categories = [
      // Receitas
      'Frete',
      'Entregas',
      'Serviços',
      'Comissões',
      'Outros',
      
      // Despesas
      'Combustível',
      'Manutenção',
      'Pedágios',
      'Estacionamento',
      'Alimentação',
      'Documentação',
      'Seguro',
      'Impostos',
      'Outros'
    ];
    
    return categories;
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
}

// Gerar dados de exemplo para usuários novos (opcional)
export function generateSampleData(userId: string): FinancialTransaction[] {
  const today = new Date();
  const sampleTransactions: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      userId,
      type: 'revenue',
      category: 'Frete',
      amount: 150.00,
      description: 'Entrega de mercadorias',
      date: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Ontem
      km: 120,
      hours: 6,
      fuel: 25,
      location: 'São Paulo - SP',
      notes: 'Entrega realizada com sucesso'
    },
    {
      userId,
      type: 'expense',
      category: 'Combustível',
      amount: 80.00,
      description: 'Abastecimento',
      date: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      km: 120,
      fuel: 20,
      location: 'Posto Ipiranga',
      notes: 'Gasolina comum'
    }
  ];

  return sampleTransactions as FinancialTransaction[];
}
