import { useCallback } from 'react';

export const useCacheCleanup = () => {
  const clearAllCaches = useCallback(async () => {
    try {
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Limpar caches do service worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Limpar service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }

      console.log('✅ Cache limpo com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      return false;
    }
  }, []);

  const clearServiceWorkerCache = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
      console.log('✅ Service Worker limpo com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar Service Worker:', error);
      return false;
    }
  }, []);

  return {
    clearAllCaches,
    clearServiceWorkerCache
  };
};

