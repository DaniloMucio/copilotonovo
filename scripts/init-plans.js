const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where, orderBy } = require('firebase/firestore');

// Configuração do Firebase (usando as mesmas variáveis de ambiente)
const firebaseConfig = {
  apiKey: "AIzaSyBvQZvQZvQZvQZvQZvQZvQZvQZvQZvQZvQ",
  authDomain: "co-pilotogit.firebaseapp.com",
  projectId: "co-pilotogit",
  storageBucket: "co-pilotogit.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Planos padrão do sistema
const DEFAULT_PLANS = [
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

async function initializePlans() {
  try {
    console.log('Verificando se já existem planos...');
    
    // Verificar se já existem planos
    const q = query(
      collection(db, 'plans'),
      where('isActive', '==', true),
      orderBy('price', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.size > 0) {
      console.log('Planos já existem no Firestore. Nenhuma ação necessária.');
      return;
    }
    
    console.log('Criando planos padrão...');
    
    // Criar planos padrão
    for (const planData of DEFAULT_PLANS) {
      await addDoc(collection(db, 'plans'), {
        ...planData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Plano "${planData.name}" criado com sucesso`);
    }
    
    console.log('✅ Planos padrão inicializados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar planos:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializePlans().then(() => {
    console.log('Script finalizado');
    process.exit(0);
  });
}

module.exports = { initializePlans };
