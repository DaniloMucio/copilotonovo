import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Message } from 'firebase-admin/messaging';

// Inicializar Firebase Admin
admin.initializeApp();

// Obter instâncias do Admin SDK
const auth = admin.auth();
const firestore = admin.firestore();

// Interface para dados de notificação
interface NotificationData {
  userId: string;
  title: string;
  body: string;
  type: 'delivery' | 'payment' | 'journey' | 'system' | 'general';
  data?: Record<string, any>;
}

// Função auxiliar para enviar notificação push
async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  type: 'delivery' | 'payment' | 'journey' | 'system' | 'general',
  data?: Record<string, any>
): Promise<void> {
  try {
    // Buscar token FCM do usuário
    const tokenDoc = await admin.firestore()
      .collection('fcmTokens')
      .doc(userId)
      .get();

    if (!tokenDoc.exists) {
      console.warn(`Token FCM não encontrado para usuário ${userId}`);
      return;
    }

    const tokenData = tokenDoc.data();
    const fcmToken = tokenData?.token;

    if (!fcmToken) {
      console.warn(`Token FCM inválido para usuário ${userId}`);
      return;
    }

    // Preparar payload da mensagem
    const payload: Message = {
      notification: {
        title,
        body,
      },
      data: {
        type,
        ...data,
      },
      token: fcmToken,
    };

    // Enviar notificação
    const response = await admin.messaging().send(payload);
    
    console.log(`Notificação enviada para usuário ${userId}:`, response);

    // Salvar notificação no Firestore
    await admin.firestore().collection('notifications').add({
      userId,
      title,
      body,
      type,
      data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      fcmMessageId: response,
    });
  } catch (error) {
    console.error(`Erro ao enviar notificação para usuário ${userId}:`, error);
  }
}

// Função para enviar notificação push
export const sendPushNotification = functions.https.onCall(
  async (data: NotificationData, context) => {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário deve estar autenticado'
      );
    }

    try {
      // Buscar token FCM do usuário
      const tokenDoc = await admin.firestore()
        .collection('fcmTokens')
        .doc(data.userId)
        .get();

      if (!tokenDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Token FCM não encontrado para o usuário'
        );
      }

      const tokenData = tokenDoc.data();
      const fcmToken = tokenData?.token;

      if (!fcmToken) {
        throw new functions.https.HttpsError(
          'not-found',
          'Token FCM inválido'
        );
      }

      // Preparar payload da mensagem
      const payload: Message = {
        notification: {
          title: data.title,
          body: data.body,
        },
        data: {
          type: data.type,
          ...data.data,
        },
        token: fcmToken,
      };

      // Enviar notificação
      const response = await admin.messaging().send(payload);
      
      console.log('Notificação enviada com sucesso:', response);

      // Salvar notificação no Firestore
      await admin.firestore().collection('notifications').add({
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        data: data.data,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmMessageId: response,
      });

      return { success: true, messageId: response };
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erro interno ao enviar notificação'
      );
    }
  }
);

// Função para notificar entrega criada
export const notifyDeliveryCreated = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    
    // Verificar se é uma entrega
    if (transaction.category !== 'Entrega' || !transaction.assignedDriverId) {
      return;
    }

    try {
      // Buscar dados do cliente
      const clientDoc = await admin.firestore()
        .collection('users')
        .doc(transaction.clientId)
        .get();

      const clientData = clientDoc.data();
      const clientName = clientData?.displayName || 'Cliente';

      // Enviar notificação para o motorista
      await sendPushNotificationToUser(
        transaction.assignedDriverId,
        'Nova Entrega Disponível',
        `Você recebeu uma nova entrega de ${clientName}`,
        'delivery',
        {
          deliveryId: context.params.transactionId,
          actionUrl: '/dashboard/entregas',
        }
      );

      console.log('Notificação de entrega criada enviada');
    } catch (error) {
      console.error('Erro ao enviar notificação de entrega criada:', error);
    }
  });

// Função para notificar mudança de status da entrega
export const notifyDeliveryStatusChange = functions.firestore
  .document('transactions/{transactionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Verificar se o status da entrega mudou
    if (before.deliveryStatus === after.deliveryStatus) {
      return;
    }

    try {
      let title = '';
      let body = '';
      let targetUserId = '';

      switch (after.deliveryStatus) {
        case 'Confirmada':
          title = 'Entrega Aceita';
          body = 'Sua entrega foi aceita pelo motorista';
          targetUserId = after.clientId;
          break;
        case 'Recusada':
          title = 'Entrega Recusada';
          body = 'Sua entrega foi recusada pelo motorista';
          targetUserId = after.clientId;
          break;
        case 'Entregue':
          title = 'Entrega Concluída';
          body = 'Sua entrega foi concluída com sucesso!';
          targetUserId = after.clientId;
          break;
        default:
          return;
      }

      if (targetUserId) {
        await sendPushNotificationToUser(
          targetUserId,
          title,
          body,
          'delivery',
          {
            deliveryId: context.params.transactionId,
            actionUrl: '/dashboard/cliente/entregas',
          }
        );

        console.log(`Notificação de status ${after.deliveryStatus} enviada`);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de mudança de status:', error);
    }
  });

// Função para criar usuário sem fazer login automático (apenas para admins)
export const createUserByAdmin = functions.https.onCall(
  async (data: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    companyName?: string;
    userType: 'motorista' | 'cliente' | 'admin';
    isActive?: boolean;
    isOnline?: boolean;
  }, context) => {
    // Verificar se o usuário está autenticado e é admin
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário deve estar autenticado'
      );
    }

    // Verificar se o usuário é admin
    const adminDoc = await admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .get();

    if (!adminDoc.exists || adminDoc.data()?.userType !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas administradores podem criar usuários'
      );
    }

    try {
      // Criar usuário no Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        disabled: !data.isActive,
      });

      // Criar documento do usuário no Firestore
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        displayName: data.displayName,
        email: data.email,
        phone: data.phone || '',
        companyName: data.companyName || '',
        userType: data.userType,
        isActive: data.isActive ?? true,
        isOnline: data.isOnline ?? false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Usuário criado com sucesso: ${userRecord.uid}`);
      
      return {
        success: true,
        userId: userRecord.uid,
        message: 'Usuário criado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erro interno ao criar usuário'
      );
    }
  }
);

// Função para limpar notificações antigas
export const cleanupOldNotifications = functions.pubsub
  .schedule('0 2 * * *') // Executa diariamente às 2h
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldNotifications = await admin.firestore()
        .collection('notifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .get();

      const batch = admin.firestore().batch();
      oldNotifications.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`${oldNotifications.docs.length} notificações antigas removidas`);
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
    }
  });

// Função para deletar usuário completamente (Admin SDK)
export const deleteUserCompletely = functions.https.onCall(async (data, context) => {
  try {
    // Verificar se o usuário está autenticado e é admin
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const { userId, userType } = data;
    
    if (!userId || !userType) {
      throw new functions.https.HttpsError('invalid-argument', 'userId e userType são obrigatórios');
    }

    // Verificar se o usuário é admin
    const adminUser = await firestore.collection('users').doc(context.auth.uid).get();
    const adminData = adminUser.data();
    
    if (!adminData || adminData.userType !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem deletar usuários');
    }

    console.log(`🗑️ ADMIN SDK: Iniciando exclusão completa do usuário ${userId} (${userType})`);

    // PASSO 1: Deletar todos os dados do Firestore
    console.log(`📋 PASSO 1: Removendo dados do Firestore...`);
    
    const collectionsToCheck = [
      { name: 'users', field: '__name__', value: userId },
      { name: 'transactions', field: 'userId', value: userId },
      { name: 'appointments', field: 'userId', value: userId },
      { name: 'workShifts', field: 'userId', value: userId },
      { name: 'vehicles', field: 'userId', value: userId },
      { name: 'notifications', field: 'userId', value: userId },
      { name: 'notificationSettings', field: 'userId', value: userId },
      { name: 'subscriptions', field: 'userId', value: userId },
      { name: 'deliveries', field: 'userId', value: userId },
      { name: 'deliveries', field: 'clientId', value: userId },
      { name: 'deliveries', field: 'driverId', value: userId },
      { name: 'transactions', field: 'clientId', value: userId },
      { name: 'transactions', field: 'driverId', value: userId },
      { name: 'transactions', field: 'assignedDriverId', value: userId }
    ];

    let deletedCount = 0;
    const errors: string[] = [];

    for (const collectionInfo of collectionsToCheck) {
      try {
        console.log(`🔍 Verificando coleção: ${collectionInfo.name} (campo: ${collectionInfo.field})`);
        
        const q = firestore.collection(collectionInfo.name)
          .where(collectionInfo.field, '==', collectionInfo.value);
        const snapshot = await q.get();

        if (snapshot.size > 0) {
          console.log(`📄 Encontrados ${snapshot.size} documentos em ${collectionInfo.name}`);
          
          const batch = firestore.batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            deletedCount++;
          });
          
          await batch.commit();
          console.log(`✅ ${snapshot.size} documentos excluídos de ${collectionInfo.name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao processar coleção ${collectionInfo.name}:`, error);
        errors.push(`Erro na coleção ${collectionInfo.name}: ${error}`);
      }
    }

    // PASSO 2: Deletar conta do Firebase Authentication
    console.log(`🔐 PASSO 2: Removendo conta do Firebase Authentication...`);
    try {
      await auth.deleteUser(userId);
      console.log(`✅ ADMIN SDK: Conta do Firebase Auth deletada com sucesso`);
    } catch (authError) {
      console.error('❌ ADMIN SDK: Erro ao deletar conta do Firebase Auth:', authError);
      errors.push(`Erro ao deletar conta do Firebase Auth: ${authError}`);
    }

    const result = {
      success: errors.length === 0,
      deletedCount,
      errors,
      firebaseAuthDeleted: errors.length === 0 || !errors.some(e => e.includes('Firebase Auth'))
    };

    console.log(`🎯 ADMIN SDK: Exclusão completa finalizada:`);
    console.log(`📊 Total de documentos excluídos: ${deletedCount}`);
    console.log(`🔐 Firebase Auth deletado: ${result.firebaseAuthDeleted}`);
    console.log(`⚠️ Erros encontrados: ${errors.length}`);

    return result;

  } catch (error) {
    console.error('❌ ADMIN SDK: Erro crítico na exclusão completa:', error);
    throw new functions.https.HttpsError('internal', `Erro ao excluir usuário: ${error}`);
  }
});
