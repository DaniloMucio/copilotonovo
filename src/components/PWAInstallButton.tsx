
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

export const PWAInstallButton = ({ canInstall, install, variant = 'icon' }: PWAInstallButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Debug: mostrar informações sobre o estado do PWA
  const debugInfo = {
    canInstall, 
    variant, 
    dismissed,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    location: typeof window !== 'undefined' ? window.location.href : 'server',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'server'
  };
  
  console.log('PWAInstallButton render:', debugInfo);

  // Para debug: sempre mostrar em desenvolvimento ou se atender critérios básicos
  const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  const isHTTPS = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  
  const shouldShow = canInstall || isDevelopment || (isHTTPS && hasServiceWorker);
  
  if (!shouldShow || (variant === 'banner' && dismissed)) {
    console.log('PWAInstallButton not showing:', { 
      canInstall, 
      variant, 
      dismissed,
      shouldShow,
      isDevelopment,
      isHTTPS,
      hasServiceWorker,
      reason: !shouldShow ? 'cannot install' : 'dismissed'
    });
    return null;
  }

  const handleInstall = () => {
    install();
    setShowDialog(false);
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
              <p className="text-xs opacity-90">Acesso rápido como app nativo</p>
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
              Instale o Co-Piloto como um aplicativo nativo para acesso mais rápido e melhor experiência.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="flex gap-2 pt-4">
              <Button onClick={handleInstall} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Instalar
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Talvez depois
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
