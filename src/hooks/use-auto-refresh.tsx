'use client';

import { useCallback, useRef } from 'react';

/**
 * Hook para gerenciar refresh automático de dados
 * Evita múltiplas chamadas simultâneas e garante que os dados sejam atualizados
 */
export function useAutoRefresh() {
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshData = useCallback(async (
    refreshFunction: () => Promise<void>,
    delay: number = 100
  ) => {
    console.log('🔄 useAutoRefresh: Iniciando refresh...');
    
    // Se já está fazendo refresh, aguarda um pouco e tenta novamente
    if (isRefreshingRef.current) {
      console.log('🔄 useAutoRefresh: Já está fazendo refresh, aguardando...');
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        refreshData(refreshFunction, delay);
      }, delay);
      return;
    }

    try {
      isRefreshingRef.current = true;
      console.log('🔄 useAutoRefresh: Executando refresh...');
      await refreshFunction();
      console.log('✅ useAutoRefresh: Refresh concluído com sucesso!');
    } catch (error) {
      console.error('❌ useAutoRefresh: Erro ao atualizar dados:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  const refreshWithDelay = useCallback(async (
    refreshFunction: () => Promise<void>,
    delay: number = 1000
  ) => {
    console.log(`🔄 useAutoRefresh: Agendando refresh com delay de ${delay}ms...`);
    
    // Limpa timeout anterior se existir
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Agenda o refresh com delay
    refreshTimeoutRef.current = setTimeout(() => {
      refreshData(refreshFunction);
    }, delay);
  }, [refreshData]);

  return {
    refreshData,
    refreshWithDelay,
    isRefreshing: isRefreshingRef.current
  };
}
