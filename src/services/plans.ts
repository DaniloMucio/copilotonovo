import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plan, PlanType } from '@/types/plans';

const PLANS_COLLECTION = 'plans';

// Planos padrão do sistema
export const DEFAULT_PLANS: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Plano Básico',
    type: 'basic',
    price: 0,
    currency: 'BRL',
    interval: 'month',
    features: [
      '5 entregas por mês',
      'Dashboard básico',
      'Suporte por email',
      'Relatórios básicos'
    ],
    limits: {
      deliveries: 5,
      reports: 3,
      support: 'email',
      apiAccess: false,
      customReports: false
    },
    isActive: true
  },
  {
    name: 'Plano Profissional',
    type: 'professional',
    price: 29.90,
    currency: 'BRL',
    interval: 'month',
    features: [
      '50 entregas por mês',
      'Dashboard completo',
      'Suporte prioritário',
      'Relatórios avançados',
      'Notificações push',
      'Histórico completo'
    ],
    limits: {
      deliveries: 50,
      reports: 20,
      support: 'priority',
      apiAccess: true,
      customReports: false
    },
    isActive: true
  },
  {
    name: 'Plano Empresarial',
    type: 'enterprise',
    price: 99.90,
    currency: 'BRL',
    interval: 'month',
    features: [
      'Entregas ilimitadas',
      'Dashboard completo',
      'Suporte 24/7',
      'Relatórios personalizados',
      'Integração com APIs',
      'Usuários ilimitados',
      'Backup automático'
    ],
    limits: {
      deliveries: -1, // Ilimitado
      reports: -1, // Ilimitado
      support: '24/7',
      apiAccess: true,
      customReports: true
    },
    isActive: true
  }
];

// Buscar todos os planos ativos
export const getActivePlans = async (): Promise<Plan[]> => {
  try {
    const q = query(
      collection(db, PLANS_COLLECTION),
      where('isActive', '==', true),
      orderBy('price', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const plans: Plan[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      plans.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Plan);
    });
    
    return plans;
  } catch (error) {
    console.error('Erro ao buscar planos ativos:', error);
    throw new Error('Não foi possível carregar os planos disponíveis');
  }
};

// Buscar plano por ID
export const getPlanById = async (planId: string): Promise<Plan | null> => {
  try {
    const planDoc = await getDoc(doc(db, PLANS_COLLECTION, planId));
    
    if (!planDoc.exists()) {
      return null;
    }
    
    const data = planDoc.data();
    return {
      id: planDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Plan;
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    throw new Error('Não foi possível carregar o plano');
  }
};

// Buscar plano por tipo
export const getPlanByType = async (type: PlanType): Promise<Plan | null> => {
  try {
    const q = query(
      collection(db, PLANS_COLLECTION),
      where('type', '==', type),
      where('isActive', '==', true)
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
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Plan;
  } catch (error) {
    console.error('Erro ao buscar plano por tipo:', error);
    throw new Error('Não foi possível carregar o plano');
  }
};

// Inicializar planos padrão (apenas para admin)
export const initializeDefaultPlans = async (): Promise<void> => {
  try {
    // Verificar se já existem planos
    const existingPlans = await getActivePlans();
    
    if (existingPlans.length > 0) {
      console.log('Planos já inicializados');
      return;
    }
    
    // Criar planos padrão
    for (const planData of DEFAULT_PLANS) {
      await addDoc(collection(db, PLANS_COLLECTION), {
        ...planData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('Planos padrão inicializados com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar planos padrão:', error);
    throw new Error('Não foi possível inicializar os planos padrão');
  }
};

// Atualizar plano (apenas para admin)
export const updatePlan = async (planId: string, updates: Partial<Plan>): Promise<void> => {
  try {
    const planRef = doc(db, PLANS_COLLECTION, planId);
    await updateDoc(planRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    throw new Error('Não foi possível atualizar o plano');
  }
};

// Desativar plano (apenas para admin)
export const deactivatePlan = async (planId: string): Promise<void> => {
  try {
    await updatePlan(planId, { isActive: false });
  } catch (error) {
    console.error('Erro ao desativar plano:', error);
    throw new Error('Não foi possível desativar o plano');
  }
};
