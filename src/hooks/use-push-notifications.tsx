"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        variant: "destructive",
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
      });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast({
        title: "Notificações habilitadas",
        description: "Você receberá notificações sobre suas jornadas e transações.",
      });
      await subscribeToPush();
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Notificações negadas",
        description: "Você pode habilitar nas configurações do navegador.",
      });
      return false;
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Chave pública VAPID (você precisará gerar uma real)
      const vapidPublicKey = 'sua-chave-vapid-publica-aqui';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      setSubscription(subscription);
      
      // Enviar subscription para seu servidor
      console.log('Push subscription:', subscription);
      
    } catch (error) {
      console.error('Erro ao se inscrever para push notifications:', error);
    }
  };

  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('Co-Piloto Driver', {
        body: 'Notificação de teste funcionando!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'test-notification',
        requireInteraction: false,
      });
    }
  };

  const scheduleJourneyNotification = (startTime: Date) => {
    if (permission !== 'granted') return;

    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    
    if (timeDiff > 0) {
      setTimeout(() => {
        new Notification('Jornada Iniciada', {
          body: 'Sua jornada de trabalho foi iniciada com sucesso!',
          icon: '/icons/icon-192x192.png',
          tag: 'journey-start',
        });
      }, timeDiff);
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    sendTestNotification,
    scheduleJourneyNotification,
    canNotify: permission === 'granted',
  };
}
