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
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setShowInstallButton(false);
      } else if ((window.navigator as any).standalone) {
        // Para iOS
        setIsInstalled(true);
        setShowInstallButton(false);
      } else {
        setIsInstalled(false);
      }
    };

    // Capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setCanInstall(true);
      setShowInstallButton(true);
      
      toast({
        title: "App Disponível para Instalação! 📱",
        description: "Clique em 'Instalar App' para adicionar o Co-Piloto Driver à sua tela inicial.",
        duration: 5000,
      });
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

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [toast]);

  const installApp = async (): Promise<void> => {
    if (!installPrompt) {
      console.log('Prompt de instalação não disponível');
      return;
    }

    try {
      // Mostrar o prompt de instalação
      await installPrompt.prompt();
      
      // Aguardar a escolha do usuário
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
        setIsInstalled(true);
        setCanInstall(false);
        setShowInstallButton(false);
        
        toast({
          title: "App Instalado com Sucesso! 🎉",
          description: "O Co-Piloto Driver foi adicionado à sua tela inicial. Aproveite!",
          duration: 5000,
        });
      } else {
        console.log('Usuário rejeitou a instalação');
        
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
