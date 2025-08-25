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
    // Verifica se está no cliente (browser)
    if (typeof window === 'undefined') {
      console.log('PWA: Hook running on server, skipping...');
      return;
    }

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

    // Verifica se o PWA pode ser instalado baseado em outros critérios
    const checkPWAInstallability = () => {
      const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      
      console.log('PWA: Installability check:', {
        isHTTPS,
        hasServiceWorker,
        hasPushManager,
        userAgent: navigator.userAgent
      });

      // Se estiver em HTTPS e tiver service worker, mas não tiver prompt, 
      // pode ser que o navegador ainda não tenha disparado o evento
      if (isHTTPS && hasServiceWorker && !installPrompt && !isStandalone) {
        console.log('PWA: Conditions met but no prompt yet. Waiting...');
      }
    };

    // Executa a verificação após um delay para dar tempo do service worker carregar
    setTimeout(checkPWAInstallability, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', checkStandalone);
    };
  }, []); // Removidas dependências que causam re-renders infinitos

  const handleInstall = async () => {
    if (installPrompt) {
      // Se tiver prompt automático, usa ele
      await installPrompt.prompt();
      
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setInstallPrompt(null);
        setIsStandalone(true);
      } else {
        console.log('User dismissed the install prompt');
      }
    } else {
      // Se não tiver prompt, tenta instalação manual
      console.log('No install prompt available, trying manual installation...');
      
      // Verifica se o navegador suporta instalação manual
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          // Tenta registrar o service worker manualmente
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered manually:', registration);
          
                // Detecta se o navegador tem botão de instalação
      const hasInstallButton = window.location.protocol === 'https:' && 
        (navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge'));
      
      if (hasInstallButton) {
        // Navegador moderno - mostra instruções específicas
        alert('Para instalar o app:\n\n1. Procure o ícone de instalação (🔽) na barra de endereços\n2. Clique nele e depois em "Instalar"\n3. Ou use o menu do navegador (⋮) → "Instalar Co-Piloto"');
      } else {
        // Navegador antigo - mostra instruções gerais
        alert('Para instalar o app:\n\n1. Use o menu do navegador (⋮)\n2. Procure por "Instalar app" ou "Adicionar à tela inicial"\n3. Ou use Ctrl+Shift+I → Application → Install');
      }
        } catch (error) {
          console.error('Failed to register service worker manually:', error);
          alert('Instalação automática não disponível. Use o menu do navegador para instalar o app.');
        }
      } else {
        alert('Seu navegador não suporta instalação de PWA. Use o menu do navegador para instalar o app.');
      }
    }
  };

  // Verifica se o PWA pode ser instalado baseado em critérios básicos
  const canInstallBasic = !isStandalone && 
    (typeof window !== 'undefined') && 
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost') &&
    ('serviceWorker' in navigator);

  // Retorna true se tiver o prompt OU se atender aos critérios básicos
  const canInstallFinal = !!installPrompt || canInstallBasic;

  return { 
    canInstall: canInstallFinal, 
    install: handleInstall,
    hasPrompt: !!installPrompt,
    canInstallBasic
  };
};
