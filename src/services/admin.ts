import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  writeBatch
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
    
    // Debug: verificar status das entregas
    console.log('🔍 Debug - Total de transações:', transactions.length);
    console.log('🔍 Debug - Total de entregas:', deliveries.length);
    console.log('🔍 Debug - Status das entregas:', deliveries.map(d => ({
      id: d.id,
      status: d.deliveryStatus,
      category: d.category
    })));
    
    const pendingDeliveries = deliveries.filter(d => d.deliveryStatus === 'Pendente').length;
    const completedDeliveries = deliveries.filter(d => d.deliveryStatus === 'Entregue').length;
    
    console.log('🔍 Debug - Entregas pendentes:', pendingDeliveries);
    console.log('🔍 Debug - Entregas concluídas:', completedDeliveries);

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
 * Busca entregas pendentes com detalhes
 */
export const getPendingDeliveries = async (): Promise<Transaction[]> => {
  try {
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    
    const pendingDeliveries = transactions.filter(t => 
      t.category === 'Entrega' && t.deliveryStatus === 'Pendente'
    );
    
    console.log('🔍 Debug - Entregas pendentes encontradas:', pendingDeliveries.length);
    console.log('🔍 Debug - Detalhes das entregas pendentes:', pendingDeliveries.map(d => ({
      id: d.id,
      status: d.deliveryStatus,
      description: d.description,
      amount: d.amount,
      date: d.date
    })));
    
    return pendingDeliveries;
  } catch (error) {
    console.error('Erro ao buscar entregas pendentes:', error);
    throw error;
  }
};

/**
 * Atualiza o status de uma entrega
 */
export const updateDeliveryStatus = async (deliveryId: string, newStatus: string): Promise<void> => {
  try {
    const deliveryRef = doc(db, 'transactions', deliveryId);
    await updateDoc(deliveryRef, {
      deliveryStatus: newStatus,
      updatedAt: new Date()
    });
    
    console.log(`✅ Status da entrega ${deliveryId} atualizado para: ${newStatus}`);
  } catch (error) {
    console.error('Erro ao atualizar status da entrega:', error);
    throw error;
  }
};

/**
 * Exclui uma entrega
 */
export const deleteDelivery = async (deliveryId: string): Promise<void> => {
  try {
    const deliveryRef = doc(db, 'transactions', deliveryId);
    await deleteDoc(deliveryRef);
    
    console.log(`✅ Entrega ${deliveryId} excluída com sucesso`);
  } catch (error) {
    console.error('Erro ao excluir entrega:', error);
    throw error;
  }
};

/**
 * Busca entregas em andamento
 */
export const getInProgressDeliveries = async (): Promise<Transaction[]> => {
  try {
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    
    const inProgressDeliveries = transactions.filter(t => 
      t.category === 'Entrega' && t.deliveryStatus === 'A caminho'
    );
    
    console.log('🔍 Debug - Entregas em andamento encontradas:', inProgressDeliveries.length);
    console.log('🔍 Debug - Detalhes das entregas em andamento:', inProgressDeliveries.map(d => ({
      id: d.id,
      status: d.deliveryStatus,
      description: d.description,
      amount: d.amount,
      date: d.date
    })));
    
    return inProgressDeliveries;
  } catch (error) {
    console.error('Erro ao buscar entregas em andamento:', error);
    throw error;
  }
};

/**
 * Busca entregas concluídas
 */
export const getCompletedDeliveries = async (): Promise<Transaction[]> => {
  try {
    const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    
    const completedDeliveries = transactions.filter(t => 
      t.category === 'Entrega' && t.deliveryStatus === 'Entregue'
    );
    
    console.log('🔍 Debug - Entregas concluídas encontradas:', completedDeliveries.length);
    console.log('🔍 Debug - Detalhes das entregas concluídas:', completedDeliveries.map(d => ({
      id: d.id,
      status: d.deliveryStatus,
      description: d.description,
      amount: d.amount,
      date: d.date
    })));
    
    return completedDeliveries;
  } catch (error) {
    console.error('Erro ao buscar entregas concluídas:', error);
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
    // Buscar todas as transações primeiro e filtrar no cliente para evitar necessidade de índice
    const q = query(collection(db, 'transactions'));
    const querySnapshot = await getDocs(q);
    
    const allTransactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    
    // Filtrar entregas no cliente e ordenar por data
    const deliveries = allTransactions
      .filter(t => t.category === 'Entrega')
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateB.getTime() - dateA.getTime();
      });
    
    return deliveries;
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
    // Buscar todas as transações e ordenar no cliente para evitar necessidade de índice
    const q = query(collection(db, 'transactions'));
    const querySnapshot = await getDocs(q);
    
    const allTransactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    
    // Ordenar no cliente por data (mais recente primeiro) e limitar
    const sortedTransactions = allTransactions
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate();
        const dateB = b.date instanceof Date ? b.date : b.date.toDate();
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 1000); // Limitar para performance
    
    return sortedTransactions;
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

/**
 * Atualiza dados de um usuário (função para administradores)
 */
export const updateUserByAdmin = async (userId: string, updateData: Partial<UserData>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Adicionar timestamp de atualização
    const dataWithTimestamp = {
      ...updateData,
      updatedAt: new Date(),
    };
    
    await updateDoc(userRef, dataWithTimestamp);
    
    console.log(`✅ Usuário ${userId} atualizado com sucesso`);
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    throw new Error('Não foi possível atualizar os dados do usuário. Tente novamente.');
  }
};

/**
 * EXCLUSÃO COMPLETA DE USUÁRIO POR ADMINISTRADOR
 * Remove TODOS os dados relacionados ao usuário do sistema.
 * Após esta exclusão, o email poderá ser reutilizado para criar uma nova conta.
 */
export const deleteUserByAdmin = async (userId: string, userType: 'motorista' | 'cliente' | 'admin'): Promise<{
  success: boolean;
  deletedCount: number;
  errors: string[];
  firebaseAuthDeleted?: boolean;
}> => {
  try {
    console.log(`🗑️ ADMIN: Iniciando exclusão completa do usuário ${userId} (${userType})`);
    
    // Importar a função do backend (Firebase Functions)
    const { httpsCallable } = await import('firebase/functions');
    const { getFunctions } = await import('firebase/functions');
    const { app } = await import('@/lib/firebase');
    
    const functions = getFunctions(app);
    const deleteUserCompletely = httpsCallable(functions, 'deleteUserCompletely');
    
    console.log(`🚀 ADMIN: Chamando função do backend para exclusão completa...`);
    
    // Chamar a função do backend que usa Admin SDK
    const result = await deleteUserCompletely({
      userId,
      userType
    });
    
    const data = result.data as {
      success: boolean;
      deletedCount: number;
      errors: string[];
      firebaseAuthDeleted: boolean;
    };
    
    if (data.success) {
      console.log(`✅ ADMIN: Usuário ${userId} excluído completamente - ${data.deletedCount} documentos removidos`);
      console.log(`🔐 ADMIN: Firebase Auth deletado: ${data.firebaseAuthDeleted}`);
    } else {
      console.warn(`⚠️ ADMIN: Exclusão parcial do usuário ${userId} - ${data.errors.length} erros encontrados`);
      console.warn('Erros:', data.errors);
    }

    return data;

  } catch (error) {
    console.error('❌ ADMIN: Erro crítico ao excluir usuário:', error);
    
    // Fallback: tentar exclusão local se a função do backend falhar
    console.log(`🔄 ADMIN: Tentando exclusão local como fallback...`);
    
    try {
      const { deleteUserCompletely } = await import('./firestore');
      const firestoreResult = await deleteUserCompletely(userId, userType, true);
      
      return {
        ...firestoreResult,
        firebaseAuthDeleted: false,
        errors: [
          ...firestoreResult.errors,
          'Firebase Auth não foi deletado (função do backend falhou)'
        ]
      };
    } catch (fallbackError) {
      console.error('❌ ADMIN: Fallback também falhou:', fallbackError);
      throw new Error(`Não foi possível excluir o usuário. Erro: ${error}`);
    }
  }
};

// Função para atribuir plano a um usuário
export const assignPlanToUser = async (userId: string, planId: string): Promise<void> => {
  try {
    console.log(`🎯 Atribuindo plano ${planId} ao usuário ${userId}`);
    
    // Primeiro, desativar assinaturas ativas do usuário
    const activeSubscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId),
      where('status', 'in', ['active', 'trial'])
    );
    
    const activeSubscriptionsSnapshot = await getDocs(activeSubscriptionsQuery);
    
    // Desativar assinaturas ativas
    for (const subscriptionDoc of activeSubscriptionsSnapshot.docs) {
      await updateDoc(doc(db, 'subscriptions', subscriptionDoc.id), {
        status: 'cancelled',
        updatedAt: new Date()
      });
    }
    
    // Criar nova assinatura
    const subscriptionData = {
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, 'subscriptions'), subscriptionData);
    
    console.log(`✅ Plano ${planId} atribuído com sucesso ao usuário ${userId}`);
  } catch (error) {
    console.error('❌ Erro ao atribuir plano ao usuário:', error);
    throw new Error('Não foi possível atribuir o plano ao usuário. Tente novamente.');
  }
};

// Função para remover plano de um usuário
export const removePlanFromUser = async (userId: string): Promise<void> => {
  try {
    console.log(`🗑️ Removendo plano do usuário ${userId}`);
    
    // Buscar e desativar todas as assinaturas ativas do usuário
    const activeSubscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId),
      where('status', 'in', ['active', 'trial'])
    );
    
    const activeSubscriptionsSnapshot = await getDocs(activeSubscriptionsQuery);
    
    for (const subscriptionDoc of activeSubscriptionsSnapshot.docs) {
      await updateDoc(doc(db, 'subscriptions', subscriptionDoc.id), {
        status: 'cancelled',
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Plano removido com sucesso do usuário ${userId}`);
  } catch (error) {
    console.error('❌ Erro ao remover plano do usuário:', error);
    throw new Error('Não foi possível remover o plano do usuário. Tente novamente.');
  }
};

/**
 * Inicializa o campo isOnline para todos os usuários que não possuem este campo.
 * Esta função deve ser executada apenas por administradores.
 */
export const initializeIsOnlineField = async (): Promise<{ success: boolean; message: string; updatedCount: number }> => {
  try {
    console.log("🔄 Inicializando campo isOnline para usuários existentes...");
    
    // Buscar todos os usuários
    const usersQuery = query(collection(db, "users"));
    const usersSnapshot = await getDocs(usersQuery);
    
    const batch = writeBatch(db);
    let updateCount = 0;
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Se o campo isOnline não existir, inicializar como false
      if (data.isOnline === undefined) {
        batch.update(doc.ref, { isOnline: false });
        updateCount++;
        console.log(`📝 Marcado para atualização: ${doc.id} (${data.userType}) - ${data.displayName}`);
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Campo isOnline inicializado para ${updateCount} usuários`);
      return {
        success: true,
        message: `Campo isOnline inicializado para ${updateCount} usuários`,
        updatedCount: updateCount
      };
    } else {
      console.log("ℹ️ Todos os usuários já possuem o campo isOnline");
      return {
        success: true,
        message: "Todos os usuários já possuem o campo isOnline",
        updatedCount: 0
      };
    }
    
  } catch (error) {
    console.error("❌ Erro ao inicializar campo isOnline:", error);
    return {
      success: false,
      message: `Erro ao inicializar campo isOnline: ${error}`,
      updatedCount: 0
    };
  }
};
