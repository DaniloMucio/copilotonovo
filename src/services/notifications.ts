import { 
  getToken, 
  onMessage, 
  MessagePayload,
  deleteToken 
} from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

// Tipos para notificações
export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'delivery' | 'payment' | 'journey' | 'system' | 'general';
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  icon?: string;
}

export interface NotificationSettings {
  userId: string;
  pushEnabled: boolean;
  deliveryNotifications: boolean;
  paymentNotifications: boolean;
  journeyNotifications: boolean;
  systemNotifications: boolean;
  emailNotifications: boolean;
}

  // Chave VAPID para push notifications
  const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || '';

class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;
  private isInitialized = false;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Inicializar o serviço de notificações
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Verificar se o FCM é suportado
      if (!messaging) {
        console.warn('Firebase Messaging não está disponível');
        return false;
      }

      // Verificar se o usuário está autenticado
      if (!auth.currentUser) {
        console.warn('Usuário não autenticado, não é possível inicializar notificações');
        return false;
      }

      // Registrar service worker para notificações
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        } catch (error) {
          console.error('Erro ao registrar service worker:', error);
        }
      }

      // Solicitar permissão para notificações
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permissão para notificações negada');
        return false;
      }

      // Aguardar um pouco para garantir que o usuário está autenticado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar novamente se o usuário está autenticado
      if (!auth.currentUser) {
        console.warn('Usuário não autenticado após delay');
        return false;
      }

      // Tentar obter token FCM com fallback
      try {
        this.fcmToken = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.ready
        });
        
        if (this.fcmToken && auth.currentUser) {
          // Salvar token no Firestore
          await this.saveFCMToken(auth.currentUser.uid, this.fcmToken);
        }
      } catch (fcmError) {
        console.warn('Erro ao obter token FCM, usando notificações locais:', fcmError);
        // Continuar sem FCM - o sistema funcionará com notificações locais
      }

      // Configurar listener para mensagens em foreground
      try {
        onMessage(messaging, (payload) => {
          this.handleForegroundMessage(payload);
        });
      } catch (messageError) {
        console.warn('Erro ao configurar listener de mensagens:', messageError);
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
      return false;
    }
  }

  // Salvar token FCM no Firestore
  private async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      const tokenRef = doc(db, 'fcmTokens', userId);
      await setDoc(tokenRef, {
        token,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar token FCM:', error);
    }
  }

  // Remover token FCM
  async removeFCMToken(): Promise<void> {
    try {
      if (this.fcmToken && messaging) {
        await deleteToken(messaging);
        this.fcmToken = null;
        
        if (auth.currentUser) {
          const tokenRef = doc(db, 'fcmTokens', auth.currentUser.uid);
          await setDoc(tokenRef, { token: null }, { merge: true });
        }
      }
    } catch (error) {
      console.error('Erro ao remover token FCM:', error);
    }
  }

  // Lidar com mensagens em foreground
  private handleForegroundMessage(payload: MessagePayload): void {
    console.log('📱 Mensagem recebida em foreground:', payload);
    
    // Criar notificação local
    if (payload.notification) {
      const notification = new Notification(payload.notification.title || 'Co-Piloto Driver', {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: payload.data?.type || 'general',
        data: payload.data
      });

      // Salvar notificação no banco
      if (auth.currentUser && payload.data) {
        this.saveNotification({
          userId: auth.currentUser.uid,
          title: payload.notification.title || 'Notificação',
          body: payload.notification.body || '',
          type: (payload.data.type as any) || 'general',
          data: payload.data,
          read: false,
          createdAt: new Date(),
          actionUrl: payload.data.actionUrl
        });
      }

      // Fechar notificação após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  // Salvar notificação no Firestore
  async saveNotification(notification: Omit<NotificationData, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
      throw error;
    }
  }

  // Buscar notificações do usuário
  async getUserNotifications(userId: string, limitCount: number = 50): Promise<NotificationData[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as NotificationData[];
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await setDoc(notificationRef, { read: true }, { merge: true });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId);
      const unreadNotifications = notifications.filter(n => !n.read);
      
      await Promise.all(
        unreadNotifications.map(notification => 
          this.markAsRead(notification.id!)
        )
      );
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }

  // Limpar todas as notificações do usuário
  async clearAllNotifications(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId);
      
      await Promise.all(
        notifications.map(notification => 
          this.deleteNotification(notification.id!)
        )
      );
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  }

  // Limpar notificações antigas (mais de X dias)
  async clearOldNotifications(userId: string, daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const notifications = await this.getUserNotifications(userId);
      const oldNotifications = notifications.filter(n => n.createdAt < cutoffDate);
      
      await Promise.all(
        oldNotifications.map(notification => 
          this.deleteNotification(notification.id!)
        )
      );
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
    }
  }

  // Deletar uma notificação específica
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }

  // Obter configurações de notificação do usuário
  async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      // Verificar se o usuário está autenticado
      if (!auth.currentUser) {
        console.warn('Usuário não autenticado, retornando configurações padrão');
        return {
          userId,
          pushEnabled: false,
          deliveryNotifications: true,
          paymentNotifications: true,
          journeyNotifications: true,
          systemNotifications: true,
          emailNotifications: false
        };
      }

      const settingsRef = doc(db, 'notificationSettings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return settingsDoc.data() as NotificationSettings;
      }
      
      // Retornar configurações padrão se não existir
      return {
        userId,
        pushEnabled: false,
        deliveryNotifications: true,
        paymentNotifications: true,
        journeyNotifications: true,
        systemNotifications: true,
        emailNotifications: false
      };
    } catch (error) {
      console.error('Erro ao buscar configurações de notificação:', error);
      // Retornar configurações padrão em caso de erro
      return {
        userId,
        pushEnabled: false,
        deliveryNotifications: true,
        paymentNotifications: true,
        journeyNotifications: true,
        systemNotifications: true,
        emailNotifications: false
      };
    }
  }

  // Salvar configurações de notificação
  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      const settingsRef = doc(db, 'notificationSettings', settings.userId);
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error);
    }
  }

  // Enviar notificação para um usuário específico
  async sendNotificationToUser(
    userId: string, 
    title: string, 
    body: string, 
    type: NotificationData['type'] = 'general',
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Sempre salvar notificação no banco primeiro
      await this.saveNotification({
        userId,
        title,
        body,
        type,
        data,
        read: false,
        createdAt: new Date()
      });

      // Se for o usuário atual e as notificações estão habilitadas, mostrar notificação local
      if (auth.currentUser?.uid === userId && this.isNotificationEnabled()) {
        this.showLocalNotification(title, body, data);
      }

      // Tentar enviar via Cloud Functions (apenas se FCM estiver disponível)
      if (this.fcmToken) {
        try {
          const sendPushNotification = httpsCallable(functions, 'sendPushNotification');
          await sendPushNotification({
            userId,
            title,
            body,
            type,
            data
          });
        } catch (cloudFunctionError) {
          console.warn('Cloud Function não disponível, usando apenas notificações locais:', cloudFunctionError);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  // Mostrar notificação local
  private showLocalNotification(title: string, body: string, data?: Record<string, any>): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: data?.type || 'general',
        data
      });

      // Fechar notificação após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Lidar com clique na notificação
      notification.onclick = () => {
        window.focus();
        if (data?.actionUrl) {
          window.location.href = data.actionUrl;
        }
        notification.close();
      };
    }
  }

  // Notificações específicas para entregas
  async notifyDeliveryCreated(deliveryId: string, clientId: string, driverId: string): Promise<void> {
    await this.sendNotificationToUser(
      driverId,
      'Nova Entrega Disponível',
      'Você recebeu uma nova solicitação de entrega. Verifique os detalhes.',
      'delivery',
      { deliveryId, actionUrl: `/dashboard/entregas` }
    );
  }

  async notifyDeliveryAccepted(deliveryId: string, clientId: string, driverId: string): Promise<void> {
    await this.sendNotificationToUser(
      clientId,
      'Entrega Aceita',
      'Sua entrega foi aceita pelo motorista e está sendo processada.',
      'delivery',
      { deliveryId, actionUrl: `/dashboard/cliente/entregas` }
    );
  }

  async notifyDeliveryRejected(deliveryId: string, clientId: string, driverId: string): Promise<void> {
    await this.sendNotificationToUser(
      clientId,
      'Entrega Recusada',
      'Sua entrega foi recusada pelo motorista. Tente novamente com outro motorista.',
      'delivery',
      { deliveryId, actionUrl: `/dashboard/cliente/entregas` }
    );
  }

  async notifyDeliveryCompleted(deliveryId: string, clientId: string, driverId: string): Promise<void> {
    await this.sendNotificationToUser(
      clientId,
      'Entrega Concluída',
      'Sua entrega foi concluída com sucesso!',
      'delivery',
      { deliveryId, actionUrl: `/dashboard/cliente/entregas` }
    );
  }

  // Notificações para pagamentos
  async notifyPaymentReceived(deliveryId: string, clientId: string, driverId: string): Promise<void> {
    await this.sendNotificationToUser(
      driverId,
      'Pagamento Recebido',
      'Você recebeu o pagamento de uma entrega.',
      'payment',
      { deliveryId, actionUrl: `/dashboard/financeiro` }
    );
  }

  // Notificações para jornadas
  async notifyJourneyStarted(userId: string): Promise<void> {
    await this.sendNotificationToUser(
      userId,
      'Jornada Iniciada',
      'Sua jornada de trabalho foi iniciada com sucesso!',
      'journey',
      { actionUrl: `/dashboard/jornada` }
    );
  }

  async notifyJourneyEnded(userId: string): Promise<void> {
    await this.sendNotificationToUser(
      userId,
      'Jornada Finalizada',
      'Sua jornada de trabalho foi finalizada. Veja o resumo do dia.',
      'journey',
      { actionUrl: `/dashboard/jornada` }
    );
  }

  // Obter token FCM atual
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Verificar se as notificações estão habilitadas
  isNotificationEnabled(): boolean {
    return Notification.permission === 'granted' && this.isInitialized;
  }
}

// Exportar instância singleton
export const notificationService = NotificationService.getInstance();
