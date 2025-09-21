const admin = require('firebase-admin');

// Verificar se já existe uma instância do Firebase Admin
if (!admin.apps.length) {
  // Inicializar Firebase Admin usando as variáveis de ambiente
  admin.initializeApp({
    projectId: "co-pilotogit"
  });
}

const db = admin.firestore();

async function initializeIsOnlineField() {
  try {
    console.log('🔄 Inicializando campo isOnline para usuários existentes...');
    
    // Buscar todos os usuários
    const usersSnapshot = await db.collection('users').get();
    
    const batch = db.batch();
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
    } else {
      console.log('ℹ️ Todos os usuários já possuem o campo isOnline');
    }
    
    // Verificar os usuários específicos mencionados
    const specificUsers = ['02gznTIsbObk8atGkLIZ3TRkI5z2', '2GLCZW4eURhQ6R4EaWSdA9Pe7LU2'];
    
    for (const userId of specificUsers) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log(`👤 Usuário ${userId}:`, {
            displayName: userData.displayName,
            userType: userData.userType,
            isOnline: userData.isOnline,
            email: userData.email
          });
        } else {
          console.log(`❌ Usuário ${userId} não encontrado`);
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar usuário ${userId}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao inicializar campo isOnline:', error);
    throw error;
  }
}

// Executar a função
initializeIsOnlineField()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  });
