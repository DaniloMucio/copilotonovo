import { collection, doc, getDocs, getDoc, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Subscription, Usage, SubscriptionStatus, Plan, PlanLimits } from '@/types/plans';
import { getPlanById } from './plans';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const USAGE_COLLECTION = 'usage';

// Buscar assinatura ativa do usuário
export const getActiveSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    // Buscar assinaturas ativas primeiro
    const activeQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const activeSnapshot = await getDocs(activeQuery);
    
    if (!activeSnapshot.empty) {
      const doc = activeSnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        trialEndDate: data.trialEndDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Subscription;
    }
    
    // Se não encontrou ativa, buscar trial
    const trialQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'trial'),
      orderBy('createdAt', 'desc')
    );
    
    const trialSnapshot = await getDocs(trialQuery);
    
    if (!trialSnapshot.empty) {
      const doc = trialSnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        trialEndDate: data.trialEndDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Subscription;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar assinatura ativa:', error);
    throw new Error('Não foi possível carregar a assinatura');
  }
};

// Buscar uso do usuário no mês atual
export const getCurrentUsage = async (userId: string): Promise<Usage | null> => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const q = query(
      collection(db, USAGE_COLLECTION),
      where('userId', '==', userId),
      where('month', '==', currentMonth)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      lastReset: data.lastReset?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Usage;
  } catch (error) {
    console.error('Erro ao buscar uso atual:', error);
    throw new Error('Não foi possível carregar o uso atual');
  }
};

// Criar ou atualizar uso do usuário
export const updateUsage = async (userId: string, feature: 'deliveries' | 'reports', increment: number = 1): Promise<void> => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Buscar uso existente
    const q = query(
      collection(db, USAGE_COLLECTION),
      where('userId', '==', userId),
      where('month', '==', currentMonth)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Criar novo registro de uso
      await addDoc(collection(db, USAGE_COLLECTION), {
        userId,
        month: currentMonth,
        deliveries: feature === 'deliveries' ? increment : 0,
        reports: feature === 'reports' ? increment : 0,
        lastReset: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Atualizar uso existente
      const usageDoc = querySnapshot.docs[0];
      const currentData = usageDoc.data();
      
      await updateDoc(doc(db, USAGE_COLLECTION, usageDoc.id), {
        [feature]: (currentData[feature] || 0) + increment,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar uso:', error);
    throw new Error('Não foi possível atualizar o uso');
  }
};

// Verificar status completo da assinatura
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  try {
    const subscription = await getActiveSubscription(userId);
    const usage = await getCurrentUsage(userId);
    
    let currentPlan: Plan | null = null;
    if (subscription) {
      currentPlan = await getPlanById(subscription.planId);
    }
    
    const hasActiveSubscription = !!subscription && subscription.status === 'active';
    
    // Função para verificar se pode usar uma funcionalidade
    const canUseFeature = (feature: keyof PlanLimits): boolean => {
      if (!currentPlan) return false;
      
      const limit = currentPlan.limits[feature];
      
      if (typeof limit === 'boolean') {
        return limit;
      }
      
      if (typeof limit === 'number') {
        if (limit === -1) return true; // Ilimitado
        if (feature === 'deliveries' || feature === 'reports') {
          return (usage?.[feature] || 0) < limit;
        }
        return true; // Para features booleanas
      }
      
      return false;
    };
    
    // Função para verificar se está dentro dos limites
    const isWithinLimits = (feature: keyof PlanLimits, currentUsage: number): boolean => {
      if (!currentPlan) return false;
      
      const limit = currentPlan.limits[feature];
      
      if (typeof limit === 'number') {
        if (limit === -1) return true; // Ilimitado
        return currentUsage < limit;
      }
      
      return false;
    };
    
    return {
      hasActiveSubscription,
      currentPlan,
      subscription,
      usage,
      canUseFeature,
      isWithinLimits
    };
  } catch (error) {
    console.error('Erro ao verificar status da assinatura:', error);
    throw new Error('Não foi possível verificar o status da assinatura');
  }
};

// Criar nova assinatura (simulado - sem pagamento real)
export const createSubscription = async (userId: string, planId: string, trialDays: number = 7): Promise<Subscription> => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 mês de assinatura
    
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    
    const subscriptionData = {
      userId,
      planId,
      status: 'trial' as const,
      startDate,
      endDate,
      trialEndDate,
      autoRenew: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), subscriptionData);
    
    return {
      id: docRef.id,
      ...subscriptionData
    };
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    throw new Error('Não foi possível criar a assinatura');
  }
};

// Ativar assinatura (após pagamento confirmado)
export const activateSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId), {
      status: 'active',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao ativar assinatura:', error);
    throw new Error('Não foi possível ativar a assinatura');
  }
};

// Cancelar assinatura
export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId), {
      status: 'cancelled',
      autoRenew: false,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw new Error('Não foi possível cancelar a assinatura');
  }
};

// Verificar se o trial expirou e atualizar status
export const checkTrialExpiration = async (userId: string): Promise<void> => {
  try {
    const subscription = await getActiveSubscription(userId);
    
    if (subscription && subscription.status === 'trial' && subscription.trialEndDate) {
      const now = new Date();
      
      if (now > subscription.trialEndDate) {
        await updateDoc(doc(db, SUBSCRIPTIONS_COLLECTION, subscription.id), {
          status: 'expired',
          updatedAt: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Erro ao verificar expiração do trial:', error);
  }
};
