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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Marca que estamos no cliente
    setIsClient(true);
    
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
  }, [installPrompt, isStandalone]); // Dependências necessárias para o useEffect

    const handleInstall = async () => {
    if (installPrompt) {
      // Se tiver prompt automático, usa ele
      console.log('Using automatic install prompt');
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
      // Se não tiver prompt, tenta forçar instalação
      console.log('No install prompt available, trying to force installation...');
      
      try {
        // Tenta registrar o service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
          
          // Aguarda um pouco para o service worker carregar
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verifica se é mobile
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isMobile) {
            // Para mobile, tenta métodos específicos
            console.log('Mobile device detected, trying mobile-specific installation...');
            
            if ('PushManager' in window) {
              try {
                // Tenta criar uma notificação push para forçar a instalação
                const subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa1HlG5DQvRRkOjVlUFEjvZfkN8dGQKcqzQMsBTo7EluulYooYyL0HwQjw9UZtM'
                });
                console.log('Push subscription created for mobile:', subscription);
                
                // Tenta mostrar notificação para forçar instalação
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Co-Piloto', {
                    body: 'Clique aqui para instalar o app na tela inicial',
                    icon: '/icons/icon-cp-192x192.svg',
                    tag: 'install-prompt',
                    requireInteraction: true
                  });
                }
                
                // Mostra popup específico para mobile
                showInstallPopup();
              } catch (error) {
                console.log('Mobile push subscription failed, showing manual instructions');
                showInstallPopup();
              }
            } else {
              showInstallPopup();
            }
          } else {
            // Para desktop, usa método padrão
            if ('PushManager' in window) {
              try {
                const subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa1HlG5DQvRRkOjVlUFEjvZfkN8dGQKcqzQMsBTo7EluulYooYyL0HwQjw9UZtM'
                });
                console.log('Push subscription created for desktop:', subscription);
                showInstallPopup();
              } catch (error) {
                console.log('Desktop push subscription failed, showing manual instructions');
                showInstallPopup();
              }
            } else {
              showInstallPopup();
            }
          }
        } else {
          showInstallPopup();
        }
      } catch (error) {
        console.error('Installation failed:', error);
        showInstallPopup();
      }
    }
  };

  // Função para mostrar popup de instalação personalizado
  const showInstallPopup = () => {
    const isChrome = navigator.userAgent.includes('Chrome');
    const isEdge = navigator.userAgent.includes('Edge');
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    
    let message = 'Para instalar o Co-Piloto:\n\n';
    
    if (isMobile) {
      if (isAndroid && (isChrome || isEdge)) {
        message += '📱 **ANDROID + CHROME/EDGE:**\n';
        message += '1. Clique no menu (⋮) no canto superior direito\n';
        message += '2. Selecione "Instalar app" ou "Adicionar à tela inicial"\n';
        message += '3. Confirme a instalação\n\n';
        message += '💡 **Alternativa:** Procure o ícone de instalação na barra de endereços';
      } else if (isIOS && isSafari) {
        message += '📱 **iOS + SAFARI:**\n';
        message += '1. Clique no botão de compartilhar (📤)\n';
        message += '2. Selecione "Adicionar à Tela Inicial"\n';
        message += '3. Clique em "Adicionar"';
      } else if (isAndroid) {
        message += '📱 **ANDROID (Outros navegadores):**\n';
        message += '1. Clique no menu (⋮ ou ⚙️)\n';
        message += '2. Procure por "Adicionar à tela inicial"\n';
        message += '3. Ou "Instalar app"';
      } else {
        message += '📱 **MOBILE (Genérico):**\n';
        message += '1. Use o menu do navegador\n';
        message += '2. Procure por "Adicionar à tela inicial"\n';
        message += '3. Ou "Instalar app"';
      }
    } else {
      // Desktop
      if (isChrome || isEdge) {
        message += '💻 **DESKTOP CHROME/EDGE:**\n';
        message += '1. Clique no ícone de instalação (🔽) na barra de endereços\n';
        message += '2. Ou use o menu (⋮) → "Instalar Co-Piloto"\n';
        message += '3. Ou pressione Ctrl+Shift+I → Application → Install';
      } else if (isSafari) {
        message += '💻 **DESKTOP SAFARI:**\n';
        message += '1. Use o menu Safari → "Adicionar à Tela Inicial"\n';
        message += '2. Ou use o menu Compartilhar → "Adicionar à Tela Inicial"';
      } else {
        message += '💻 **DESKTOP (Outros):**\n';
        message += '1. Use o menu do navegador (⋮ ou ⚙️)\n';
        message += '2. Procure por "Instalar app" ou "Adicionar à tela inicial"';
      }
    }
    
    message += '\n\nClique em OK para continuar.';
    
    if (confirm(message)) {
      // Tenta abrir páginas específicas ou mostrar mais ajuda
      try {
        if (isMobile) {
          if (isAndroid) {
            // Para Android, tenta abrir configurações de apps
            if (confirm('Deseja abrir as configurações de apps do Android para verificar se o Co-Piloto foi instalado?')) {
              // Tenta abrir configurações (pode não funcionar em todos os dispositivos)
              console.log('Tentando abrir configurações Android...');
            }
          } else if (isIOS) {
            // Para iOS, mostra instruções específicas
            alert('📱 **Instruções para iOS:**\n\n1. Clique no botão de compartilhar (📤)\n2. Selecione "Adicionar à Tela Inicial"\n3. Clique em "Adicionar"\n\nO app aparecerá na sua tela inicial!');
          }
        } else {
          // Desktop
          if (isChrome || isEdge) {
            window.open('chrome://apps/', '_blank');
          } else if (isSafari) {
            window.open('https://support.apple.com/guide/safari/add-webpages-to-your-home-screen-ibrw1110/mac', '_blank');
          }
        }
      } catch (e) {
        console.log('Could not open browser-specific page');
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
    canInstallBasic,
    isClient
  };
};
