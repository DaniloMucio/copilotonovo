import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Message } from 'firebase-admin/messaging';

// Inicializar Firebase Admin
admin.initializeApp();

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
