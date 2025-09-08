import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { db } from '@/lib/firebase';
import { UserData } from './firestore';
import { Transaction } from './transactions';
import { WorkShift } from './workShifts';
import { Appointment } from './appointments';

// Interfaces para dados administrativos
export interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  totalClients: number;
  onlineDrivers: number;
  totalDeliveries: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  todayDeliveries: number;
  thisMonthDeliveries: number;
}

export interface UserWithStats extends UserData {
  uid: string;
  totalDeliveries?: number;
  totalRevenue?: number;
  lastActivity?: Date;
  isActive?: boolean;
}

export interface DeliveryStats {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  rejected: number;
}

export interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averageDeliveryValue: number;
  topRevenueDrivers: Array<{
    driverId: string;
    driverName: string;
    revenue: number;
  }>;
  topSpendingClients: Array<{
    clientId: string;
    clientName: string;
    spending: number;
  }>;
}

/**
 * Busca estatísticas gerais do sistema
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    // Buscar todos os usuários
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData & { uid: string }));
    
    const totalUsers = users.length;
    const totalDrivers = users.filter(u => u.userType === 'motorista').length;
    const totalClients = users.filter(u => u.userType === 'cliente').length;
    const onlineDrivers = users.filter(u => u.userType === 'motorista' && u.isOnline).length;

    // Buscar todas as transações
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    
    // Filtrar entregas
    const deliveries = transactions.filter(t => t.category === 'Entrega');
    const totalDeliveries = deliveries.length;
    const pendingDeliveries = deliveries.filter(d => d.deliveryStatus === 'Pendente').length;
    const completedDeliveries = deliveries.filter(d => d.deliveryStatus === 'Entregue').length;

    // Calcular métricas financeiras
    const revenueTransactions = transactions.filter(t => t.type === 'receita');
    const expenseTransactions = transactions.filter(t => t.type === 'despesa');
    
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Entregas de hoje
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    const todayDeliveries = deliveries.filter(d => {
      const deliveryDate = d.date instanceof Date ? d.date : d.date.toDate();
      return deliveryDate >= startOfToday && deliveryDate <= endOfToday;
    }).length;

    // Entregas do mês atual
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);
    
    const thisMonthDeliveries = deliveries.filter(d => {
      const deliveryDate = d.date instanceof Date ? d.date : d.date.toDate();
      return deliveryDate >= startOfCurrentMonth && deliveryDate <= endOfCurrentMonth;
    }).length;

    return {
      totalUsers,
      totalDrivers,
      totalClients,
      onlineDrivers,
      totalDeliveries,
      pendingDeliveries,
      completedDeliveries,
      totalRevenue,
      totalExpenses,
      netProfit,
      todayDeliveries,
      thisMonthDeliveries
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas administrativas:', error);
    throw error;
  }
};

/**
 * Busca todos os usuários com estatísticas
 */
export const getAllUsersWithStats = async (): Promise<UserWithStats[]> => {
  try {
    // Buscar todos os usuários
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData & { uid: string }));

    // Buscar todas as transações para calcular estatísticas
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

    // Calcular estatísticas para cada usuário
    const usersWithStats: UserWithStats[] = users.map(user => {
      const userTransactions = transactions.filter(t => t.userId === user.uid);
      const userDeliveries = userTransactions.filter(t => t.category === 'Entrega');
      const userRevenue = userTransactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
      
      // Última atividade (transação mais recente)
      const lastTransaction = userTransactions.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateB.getTime() - dateA.getTime();
      })[0];

      const lastActivity = lastTransaction ? 
        (lastTransaction.date instanceof Date ? lastTransaction.date : lastTransaction.date.toDate()) : 
        undefined;

      // Considerar ativo se teve atividade nos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isActive = lastActivity ? lastActivity >= thirtyDaysAgo : false;

      return {
        ...user,
        totalDeliveries: userDeliveries.length,
        totalRevenue: userRevenue,
        lastActivity,
        isActive
      };
    });

    return usersWithStats;
  } catch (error) {
    console.error('Erro ao buscar usuários com estatísticas:', error);
    throw error;
  }
};

/**
 * Busca estatísticas de entregas
 */
export const getDeliveryStats = async (): Promise<DeliveryStats> => {
  try {
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    
    const deliveries = transactions.filter(t => t.category === 'Entrega');
    
    return {
      total: deliveries.length,
      pending: deliveries.filter(d => d.deliveryStatus === 'Pendente').length,
      confirmed: deliveries.filter(d => d.deliveryStatus === 'Confirmada').length,
      inProgress: deliveries.filter(d => d.deliveryStatus === 'A caminho').length,
      completed: deliveries.filter(d => d.deliveryStatus === 'Entregue').length,
      rejected: deliveries.filter(d => d.deliveryStatus === 'Recusada').length
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de entregas:', error);
    throw error;
  }
};

/**
 * Busca estatísticas financeiras detalhadas
 */
export const getFinancialStats = async (): Promise<FinancialStats> => {
  try {
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

    const revenueTransactions = transactions.filter(t => t.type === 'receita');
    const expenseTransactions = transactions.filter(t => t.type === 'despesa');
    
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Calcular valor médio das entregas
    const deliveries = transactions.filter(t => t.category === 'Entrega');
    const averageDeliveryValue = deliveries.length > 0 ? 
      deliveries.reduce((sum, d) => sum + d.amount, 0) / deliveries.length : 0;

    // Top motoristas por receita
    const driverRevenue = new Map<string, { name: string; revenue: number }>();
    revenueTransactions.forEach(t => {
      if (t.userId) {
        const current = driverRevenue.get(t.userId) || { name: 'Motorista', revenue: 0 };
        current.revenue += t.amount;
        driverRevenue.set(t.userId, current);
      }
    });

    const topRevenueDrivers = Array.from(driverRevenue.entries())
      .map(([driverId, data]) => ({ driverId, driverName: data.name, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top clientes por gastos
    const clientSpending = new Map<string, { name: string; spending: number }>();
    const clientDeliveries = transactions.filter(t => t.clientId && t.category === 'Entrega');
    clientDeliveries.forEach(t => {
      if (t.clientId) {
        const current = clientSpending.get(t.clientId) || { name: 'Cliente', spending: 0 };
        current.spending += t.amount;
        clientSpending.set(t.clientId, current);
      }
    });

    const topSpendingClients = Array.from(clientSpending.entries())
      .map(([clientId, data]) => ({ clientId, clientName: data.name, spending: data.spending }))
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 5);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      averageDeliveryValue,
      topRevenueDrivers,
      topSpendingClients
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas financeiras:', error);
    throw error;
  }
};

/**
 * Busca todas as entregas do sistema
 */
export const getAllDeliveries = async (): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('category', '==', 'Entrega'),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  } catch (error) {
    console.error('Erro ao buscar todas as entregas:', error);
    throw error;
  }
};

/**
 * Busca todas as transações do sistema
 */
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, 'transactions'),
      orderBy('date', 'desc'),
      limit(1000) // Limitar para performance
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  } catch (error) {
    console.error('Erro ao buscar todas as transações:', error);
    throw error;
  }
};

/**
 * Busca dados de um usuário específico para administração
 */
export const getUserAdminData = async (userId: string): Promise<{
  user: UserData & { uid: string };
  transactions: Transaction[];
  deliveries: Transaction[];
  appointments?: Appointment[];
  workShifts?: WorkShift[];
}> => {
  try {
    // Buscar dados do usuário
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
    if (userDoc.empty) {
      throw new Error('Usuário não encontrado');
    }
    
    const user = { uid: userId, ...userDoc.docs[0].data() } as UserData & { uid: string };

    // Buscar transações do usuário
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

    // Filtrar entregas
    const deliveries = transactions.filter(t => t.category === 'Entrega');

    // Buscar agendamentos se for cliente
    let appointments: Appointment[] = [];
    if (user.userType === 'cliente') {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      appointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    }

    // Buscar jornadas de trabalho se for motorista
    let workShifts: WorkShift[] = [];
    if (user.userType === 'motorista') {
      const shiftsQuery = query(
        collection(db, 'workShifts'),
        where('userId', '==', userId),
        orderBy('startTime', 'desc')
      );
      const shiftsSnapshot = await getDocs(shiftsQuery);
      workShifts = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkShift));
    }

    return {
      user,
      transactions,
      deliveries,
      appointments,
      workShifts
    };
  } catch (error) {
    console.error('Erro ao buscar dados administrativos do usuário:', error);
    throw error;
  }
};
