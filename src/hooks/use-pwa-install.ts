import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UsePWAInstallReturn {
  canInstall: boolean;
  isInstalled: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  installApp: () => Promise<void>;
  showInstallButton: boolean;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se o app já está instalado
    const checkIfInstalled = () => {
      // Verificar display mode standalone
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setShowInstallButton(false);
        return;
      }
      
      // Verificar iOS standalone
      if ((window.navigator as any).standalone) {
        setIsInstalled(true);
        setShowInstallButton(false);
        return;
      }
      
      // Verificar se está em modo PWA no iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS && window.matchMedia('(display-mode: fullscreen)').matches) {
        setIsInstalled(true);
        setShowInstallButton(false);
        return;
      }
      
      setIsInstalled(false);
    };

    // Capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setCanInstall(true);
      setShowInstallButton(true);
      
      // Mostrar toast apenas se não estiver em desenvolvimento
      if (process.env.NODE_ENV !== 'development') {
        toast({
          title: "App Disponível para Instalação! 📱",
          description: "Clique em 'Instalar App' para adicionar o Co-Piloto Driver à sua tela inicial.",
          duration: 5000,
        });
      }
    };

    // Lógica específica para iOS
    const handleIOSInstall = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS && !(window.navigator as any).standalone) {
        setCanInstall(true);
        setShowInstallButton(true);
        
        // Mostrar instruções específicas para iOS
        toast({
          title: "Instalar no iOS 📱",
          description: "Toque no botão de compartilhar e selecione 'Adicionar à Tela Inicial'",
          duration: 8000,
        });
      }
    };

    // Verificar se a instalação foi concluída
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setShowInstallButton(false);
      setInstallPrompt(null);
    };

    // Verificar se o app está sendo executado em modo standalone
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setShowInstallButton(false);
      }
    };

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Verificação inicial
    checkIfInstalled();
    
    // Verificar iOS após um pequeno delay
    setTimeout(() => {
      handleIOSInstall();
    }, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [toast]);

  const installApp = async (): Promise<void> => {
    if (!installPrompt) {
      return;
    }

    try {
      // Mostrar o prompt de instalação
      await installPrompt.prompt();
      
      // Aguardar a escolha do usuário
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        setShowInstallButton(false);
        
        toast({
          title: "App Instalado com Sucesso! 🎉",
          description: "O Co-Piloto Driver foi adicionado à sua tela inicial. Aproveite!",
          duration: 5000,
        });
      } else {
        toast({
          title: "Instalação Cancelada",
          description: "Você pode instalar o app a qualquer momento clicando em 'Instalar App'.",
          duration: 3000,
        });
      }
      
      // Limpar o prompt
      setInstallPrompt(null);
    } catch (error) {
      console.error('Erro durante a instalação:', error);
    }
  };

  return {
    canInstall,
    isInstalled,
    installPrompt,
    installApp,
    showInstallButton
  };
}
