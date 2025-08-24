"use client";

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineData {
  id: string;
  type: 'transaction' | 'delivery' | 'shift';
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const { toast } = useToast();

  const getOfflineData = useCallback((): OfflineData[] => {
    try {
      const data = localStorage.getItem('offline_data');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  const updatePendingSyncCount = useCallback(() => {
    const data = getOfflineData();
    setPendingSyncCount(data.length);
  }, [getOfflineData]);

  const clearOfflineData = useCallback(() => {
    localStorage.removeItem('offline_data');
    updatePendingSyncCount();
  }, [updatePendingSyncCount]);

  const syncPendingData = useCallback(async () => {
    const pendingData = getOfflineData();
    
    if (pendingData.length === 0) return;

    let successCount = 0;
    
    for (const item of pendingData) {
      try {
        // Aqui você implementaria a lógica de sincronização
        // Por exemplo, reenviar transações, entregas, etc.
        console.log(`Sincronizando ${item.type}:`, item.data);
        successCount++;
      } catch (error) {
        console.error(`Erro ao sincronizar ${item.type}:`, error);
      }
    }

    if (successCount > 0) {
      clearOfflineData();
      toast({
        title: "Sincronização Concluída",
        description: `${successCount} item(s) sincronizado(s) com sucesso.`,
      });
    }
  }, [getOfflineData, clearOfflineData, toast]);

  const saveOfflineData = useCallback((type: OfflineData['type'], data: any) => {
    const offlineData: OfflineData = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
    };

    const existing = getOfflineData();
    existing.push(offlineData);
    localStorage.setItem('offline_data', JSON.stringify(existing));
    updatePendingSyncCount();

    toast({
      title: "Dados salvos offline",
      description: "Serão sincronizados quando a conexão retornar.",
    });
  }, [getOfflineData, updatePendingSyncCount, toast]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    updatePendingSyncCount();

    const handleOnline = async () => {
      setIsOnline(true);
      await syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Modo Offline Ativado",
        description: "Suas alterações serão sincronizadas quando a conexão retornar.",
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, syncPendingData, updatePendingSyncCount]);

  return {
    isOnline,
    pendingSyncCount,
    saveOfflineData,
    syncPendingData,
    getOfflineData,
    clearOfflineData,
  };
}
