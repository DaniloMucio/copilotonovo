'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, type NotificationData, type NotificationSettings } from '@/services/notifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  // Estado das notificações
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  
  // Configurações
  settings: NotificationSettings | null;
  
  // Funções
  initializeNotifications: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  clearOldNotifications: (daysOld?: number) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  
  // Status
  isInitialized: boolean;
  isSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  
  // Estado das notificações
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  // Configurações
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  // Inicializar serviço de notificações
  const initializeNotifications = useCallback(async (): Promise<boolean> => {
    if (!user || !isSupported) return false;

    try {
      setIsLoading(true);
      const success = await notificationService.initialize();
      
      if (success) {
        setIsInitialized(true);
      } else {
        toast({
          variant: "destructive",
          title: "Erro nas Notificações",
          description: "Não foi possível ativar as notificações. Verifique as permissões do navegador.",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
      toast({
        variant: "destructive",
        title: "Erro nas Notificações",
        description: "Ocorreu um erro ao configurar as notificações.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, toast]);

  // Carregar configurações de notificação
  const loadSettings = useCallback(async () => {
    if (!user) return;

    try {
      const userSettings = await notificationService.getNotificationSettings(user.uid);
      setSettings(userSettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, [user]);

  // Atualizar configurações
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!user || !settings) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      await notificationService.saveNotificationSettings(updatedSettings);
      setSettings(updatedSettings);
      
      toast({
        title: "Configurações Salvas",
        description: "Suas preferências de notificação foram atualizadas.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações.",
      });
    }
  }, [user, settings, toast]);

  // Atualizar lista de notificações
  const refreshNotifications = useCallback(async () => {
    if (!user || !isInitialized) return;

    try {
      setIsLoading(true);
      const userNotifications = await notificationService.getUserNotifications(user.uid);
      setNotifications(userNotifications);
      
      // Calcular notificações não lidas
      const unread = userNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isInitialized]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      // Atualizar contador
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marcar todas as notificações como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await notificationService.markAllAsRead(user.uid);
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, [user]);

  // Limpar todas as notificações
  const clearAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      await notificationService.clearAllNotifications(user.uid);
      
      // Atualizar estado local
      setNotifications([]);
      setUnreadCount(0);
      
      toast({
        title: "Notificações Limpas",
        description: "Todas as notificações foram removidas.",
      });
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      toast({
        variant: "destructive",
        title: "Erro ao Limpar",
        description: "Não foi possível limpar as notificações.",
      });
    }
  }, [user, toast]);

  // Limpar notificações antigas
  const clearOldNotifications = useCallback(async (daysOld: number = 30) => {
    if (!user) return;

    try {
      await notificationService.clearOldNotifications(user.uid, daysOld);
      
      // Recarregar notificações
      await refreshNotifications();
      
      toast({
        title: "Notificações Antigas Removidas",
        description: `Notificações com mais de ${daysOld} dias foram removidas.`,
      });
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
      toast({
        variant: "destructive",
        title: "Erro ao Limpar",
        description: "Não foi possível limpar as notificações antigas.",
      });
    }
  }, [user, refreshNotifications, toast]);

  // Deletar uma notificação específica
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Atualizar estado local
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        const unread = updated.filter(n => !n.read).length;
        setUnreadCount(unread);
        return updated;
      });
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, []);

  // Verificar suporte a notificações
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);
    };
    
    checkSupport();
  }, []);

  // Inicializar notificações quando o usuário fizer login
  useEffect(() => {
    if (user && userData && isSupported && !isInitialized) {
      // Aguardar um pouco para garantir que a autenticação está completa
      const timer = setTimeout(() => {
        initializeNotifications();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [user, userData, isSupported, isInitialized, initializeNotifications]);

  // Carregar configurações quando o usuário fizer login
  useEffect(() => {
    if (user && isSupported) {
      loadSettings();
    }
  }, [user, isSupported, loadSettings]);

  // Carregar notificações quando o usuário fizer login
  useEffect(() => {
    if (user && isInitialized) {
      refreshNotifications();
    }
  }, [user, isInitialized, refreshNotifications]);

  // Limpar notificações quando o usuário fizer logout
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsInitialized(false);
      setSettings(null);
    }
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    settings,
    initializeNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    clearOldNotifications,
    deleteNotification,
    updateSettings,
    isInitialized,
    isSupported,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
}
