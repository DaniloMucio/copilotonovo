
"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Smartphone, Monitor, X } from 'lucide-react';
import { useState } from 'react';

interface PWAInstallButtonProps {
  canInstall: boolean;
  install: () => void;
  variant?: 'icon' | 'full' | 'banner';
}

export const PWAInstallButton = ({ canInstall, install, variant = 'icon' }: PWAInstallButtonProps & { isClient?: boolean }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Verificar se deve mostrar o botão
  const shouldShow = canInstall && !(variant === 'banner' && dismissed);
  
  if (!shouldShow) {
    return null;
  }

  const handleInstall = () => {
    // Verificar se é iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Para iOS, mostrar instruções específicas
      setShowDialog(true);
    } else {
      // Para outros dispositivos, usar o método padrão
      install();
      setShowDialog(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (variant === 'banner') {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-6 w-6" />
            <div>
              <p className="font-semibold text-sm">Instalar Co-Piloto</p>
              <p className="text-xs opacity-90">
                Clique para instalar o app
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleInstall}>
              Instalar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Instalar App
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar Co-Piloto Driver</DialogTitle>
            <DialogDescription>
              {/iPad|iPhone|iPod/.test(navigator.userAgent) 
                ? "Para instalar no iOS, siga as instruções abaixo:"
                : "Instale o Co-Piloto como um aplicativo nativo para acesso mais rápido e melhor experiência."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    📱 Instruções para iOS:
                  </h4>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
                    <li>Toque no botão de compartilhar (📤) na barra inferior</li>
                    <li>Role para baixo e selecione &quot;Adicionar à Tela Inicial&quot;</li>
                    <li>Toque em &quot;Adicionar&quot; para confirmar</li>
                    <li>O app aparecerá na sua tela inicial!</li>
                  </ol>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Smartphone className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">Acesso Rápido</h4>
                    <p className="text-sm text-muted-foreground">
                      Ícone na tela inicial do seu iPhone/iPad
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Smartphone className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">Acesso Rápido</h4>
                    <p className="text-sm text-muted-foreground">
                      Ícone na tela inicial do seu dispositivo
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Monitor className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">Experiência Nativa</h4>
                    <p className="text-sm text-muted-foreground">
                      Interface otimizada sem navegador
                    </p>
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-4">
              {!/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                <Button onClick={handleInstall} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Instalar
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                {/iPad|iPhone|iPod/.test(navigator.userAgent) ? "Entendi" : "Talvez depois"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button 
      onClick={handleInstall} 
      variant="ghost" 
      size="icon"
      title="Instalar App"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};
