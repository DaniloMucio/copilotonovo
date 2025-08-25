"use client";

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se o app já está rodando em modo standalone (instalado)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      console.log('PWA: Standalone mode check:', isStandaloneMode);
      setIsStandalone(isStandaloneMode);
    };
    
    checkStandalone();
    
    // Adiciona listener para mudanças no modo de exibição
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (event: Event) => {
      console.log('PWA: Install prompt detected!', event);
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Debug: verificar se o hook está funcionando
    console.log('PWA: Install hook initialized, checking for install prompt...');

    // Verifica se já existe um prompt salvo (pode acontecer em alguns casos)
    if ('deferredPrompt' in window) {
      console.log('PWA: Found deferred prompt in window');
      setInstallPrompt((window as any).deferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', checkStandalone);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setInstallPrompt(null);
      setIsStandalone(true);
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  return { canInstall: !!installPrompt && !isStandalone, install: handleInstall };
};
