'use client';

import { useCallback, useRef, useState } from 'react';
import { firestoreCache } from '@/lib/firestore-cache';

/**
 * Hook unificado para gerenciar refresh automático de dados
 * Padroniza o comportamento de refresh em todo o projeto
 */
export function useUnifiedRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  /**
   * Executa refresh imediato com invalidação de cache
   */
  const refreshImmediate = useCallback(async (
    refreshFunction: () => Promise<void>,
    cachePattern?: string
  ) => {
    console.log('🔄 useUnifiedRefresh: Refresh imediato iniciado...');
    
    if (isRefreshingRef.current) {
      console.log('🔄 useUnifiedRefresh: Já está fazendo refresh, ignorando...');
      return;
    }

    try {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      
      // Invalidar cache se especificado
      if (cachePattern) {
        console.log('🗑️ useUnifiedRefresh: Invalidando cache:', cachePattern);
        firestoreCache.invalidate(cachePattern);
      }
      
      console.log('🔄 useUnifiedRefresh: Executando refresh...');
      await refreshFunction();
      console.log('✅ useUnifiedRefresh: Refresh imediato concluído!');
      
    } catch (error) {
      console.error('❌ useUnifiedRefresh: Erro no refresh imediato:', error);
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Executa refresh com delay (para evitar múltiplas chamadas)
   */
  const refreshWithDelay = useCallback(async (
    refreshFunction: () => Promise<void>,
    delay: number = 500,
    cachePattern?: string
  ) => {
    console.log(`🔄 useUnifiedRefresh: Agendando refresh com delay de ${delay}ms...`);
    
    // Limpar timeout anterior se existir
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Invalidar cache imediatamente
    if (cachePattern) {
      console.log('🗑️ useUnifiedRefresh: Invalidando cache imediatamente:', cachePattern);
      firestoreCache.invalidate(cachePattern);
    }

    // Agenda o refresh com delay
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        
        console.log('🔄 useUnifiedRefresh: Executando refresh agendado...');
        await refreshFunction();
        console.log('✅ useUnifiedRefresh: Refresh agendado concluído!');
        
      } catch (error) {
        console.error('❌ useUnifiedRefresh: Erro no refresh agendado:', error);
      } finally {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      }
    }, delay);
  }, []);

  /**
   * Callback padronizado para formulários
   * Deve ser chamado após inserção/atualização bem-sucedida
   */
  const onDataChange = useCallback((
    refreshFunction: () => Promise<void>,
    options: {
      immediate?: boolean;
      delay?: number;
      cachePattern?: string;
    } = {}
  ) => {
    const { immediate = true, delay = 500, cachePattern = 'transactions' } = options;
    
    console.log('📝 useUnifiedRefresh: onDataChange chamado', { immediate, delay, cachePattern });
    
    if (immediate) {
      refreshImmediate(refreshFunction, cachePattern);
    } else {
      refreshWithDelay(refreshFunction, delay, cachePattern);
    }
  }, [refreshImmediate, refreshWithDelay]);

  /**
   * Limpa timeouts ao desmontar
   */
  const cleanup = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  return {
    refreshImmediate,
    refreshWithDelay,
    onDataChange,
    isRefreshing,
    cleanup
  };
}

/**
 * Hook específico para páginas de dashboard
 * Inclui padrões de cache específicos para cada tipo de página
 */
export function useDashboardRefresh() {
  const { refreshImmediate, refreshWithDelay, onDataChange, isRefreshing, cleanup } = useUnifiedRefresh();

  /**
   * Refresh para páginas de transações (despesas/receitas)
   */
  const refreshTransactions = useCallback((
    refreshFunction: () => Promise<void>,
    immediate: boolean = true
  ) => {
    onDataChange(refreshFunction, {
      immediate,
      cachePattern: 'transactions'
    });
  }, [onDataChange]);

  /**
   * Refresh para páginas de entregas
   */
  const refreshDeliveries = useCallback((
    refreshFunction: () => Promise<void>,
    immediate: boolean = true
  ) => {
    onDataChange(refreshFunction, {
      immediate,
      cachePattern: 'transactions' // Entregas também são transações
    });
  }, [onDataChange]);

  /**
   * Refresh para páginas de rastreamento
   */
  const refreshTracking = useCallback((
    refreshFunction: () => Promise<void>,
    immediate: boolean = true
  ) => {
    onDataChange(refreshFunction, {
      immediate,
      cachePattern: 'tracking'
    });
  }, [onDataChange]);

  return {
    refreshImmediate,
    refreshWithDelay,
    onDataChange,
    refreshTransactions,
    refreshDeliveries,
    refreshTracking,
    isRefreshing,
    cleanup
  };
}
