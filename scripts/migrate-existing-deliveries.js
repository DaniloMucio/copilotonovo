// Script para migrar entregas existentes e gerar códigos de rastreamento
const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Função para gerar código de rastreamento único
function generateTrackingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Função para verificar se código já existe
async function isTrackingCodeUnique(code) {
  try {
    const trackingRef = db.collection('tracking');
    const snapshot = await trackingRef.where('trackingCode', '==', code).get();
    return snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar código único:', error);
    return false;
  }
}

// Função para gerar código único
async function generateUniqueTrackingCode() {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateTrackingCode();
    isUnique = await isTrackingCodeUnique(code);
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('Não foi possível gerar código único após várias tentativas');
    }
  } while (!isUnique);

  return code;
}

// Função para migrar entregas existentes
async function migrateExistingDeliveries() {
  try {
    console.log('🚀 Iniciando migração de entregas existentes...');
    
    // Buscar todas as transações que são entregas
    const transactionsRef = db.collection('transactions');
    const snapshot = await transactionsRef.where('category', '==', 'Entrega').get();
    
    console.log(`📦 Encontradas ${snapshot.size} entregas para migrar`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const doc of snapshot.docs) {
      try {
        const transaction = doc.data();
        const transactionId = doc.id;
        
        // Verificar se já existe dados de rastreamento
        const trackingRef = db.collection('tracking').doc(transactionId);
        const trackingDoc = await trackingRef.get();
        
        if (trackingDoc.exists) {
          console.log(`⏭️  Entrega ${transactionId} já possui dados de rastreamento, pulando...`);
          continue;
        }
        
        // Gerar código único
        const trackingCode = await generateUniqueTrackingCode();
        
        // Criar dados de rastreamento
        const trackingData = {
          id: transactionId,
          trackingCode,
          status: transaction.deliveryStatus || 'Pendente',
          recipientName: transaction.recipientName || 'N/A',
          recipientAddress: transaction.recipientAddress || 'N/A',
          createdAt: transaction.date?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedDelivery: transaction.estimatedDelivery,
          driverName: transaction.driverName,
          driverPhone: transaction.driverPhone,
          statusHistory: [
            {
              status: transaction.deliveryStatus || 'Pendente',
              timestamp: new Date().toISOString(),
              description: 'Entrega migrada do sistema antigo',
              updatedBy: transaction.clientId || transaction.userId
            }
          ],
          clientId: transaction.clientId || transaction.userId,
          driverId: transaction.assignedDriverId
        };
        
        // Salvar dados de rastreamento
        await trackingRef.set(trackingData);
        
        console.log(`✅ Entrega ${transactionId} migrada com código ${trackingCode}`);
        migrated++;
        
      } catch (error) {
        console.error(`❌ Erro ao migrar entrega ${doc.id}:`, error);
        errors++;
      }
    }
    
    console.log(`\n🎉 Migração concluída!`);
    console.log(`✅ Entregas migradas: ${migrated}`);
    console.log(`❌ Erros: ${errors}`);
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar migração
if (require.main === module) {
  migrateExistingDeliveries()
    .then(() => {
      console.log('✅ Script de migração finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateExistingDeliveries };

