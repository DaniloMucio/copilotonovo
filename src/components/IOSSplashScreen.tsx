"use client";

import { useEffect, useState } from 'react';

interface IOSSplashScreenProps {
  children: React.ReactNode;
}

export function IOSSplashScreen({ children }: IOSSplashScreenProps) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Verificar se está no iOS e se é a primeira visita
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone;
    const hasSeenSplash = sessionStorage.getItem('ios-splash-seen');

    if (isIOS && !isStandalone && !hasSeenSplash) {
      setShowSplash(true);
      sessionStorage.setItem('ios-splash-seen', 'true');
      
      // Esconder splash após 2 segundos
      setTimeout(() => {
        setShowSplash(false);
      }, 2000);
    }
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#2D3748] flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center">
            <div className="w-16 h-16 bg-[#2D3748] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">CP</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Co-Piloto Driver</h1>
          <p className="text-gray-300 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
