'use client';

import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageCircle, Phone } from 'lucide-react';

export function InactiveUserAlert() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const handleInactiveUserAlert = () => {
      setShowAlert(true);
    };

    // Escutar evento personalizado
    window.addEventListener('show-inactive-user-alert', handleInactiveUserAlert);

    return () => {
      window.removeEventListener('show-inactive-user-alert', handleInactiveUserAlert);
    };
  }, []);

  const handleWhatsAppContact = () => {
    // Número do WhatsApp do admin: 016 99745-2118
    const phoneNumber = '5516997452118'; // Formato internacional: +55 16 99745-2118
    const message = encodeURIComponent(
      'Olá! Minha conta foi desativada no sistema Co-Piloto Driver e não consigo fazer login. Poderia me ajudar a reativar minha conta? Obrigado!'
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Abrir WhatsApp em nova aba
    window.open(whatsappUrl, '_blank');
    setShowAlert(false);
  };

  const handleTryAgain = () => {
    setShowAlert(false);
    // Recarregar a página para tentar login novamente
    window.location.reload();
  };

  return (
    <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
      <AlertDialogContent className="w-[95%] max-w-sm bg-white rounded-lg shadow-xl">
        <div className="text-center p-4">
          {/* Ícone simples */}
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          
          {/* Título */}
          <AlertDialogTitle className="text-lg font-bold text-gray-900 mb-2">
            Conta Desativada
          </AlertDialogTitle>
          
          {/* Descrição */}
          <AlertDialogDescription className="text-sm text-gray-600 mb-4">
            Sua conta foi desativada. Entre em contato com o administrador para reativar.
          </AlertDialogDescription>
          
          {/* Info do admin */}
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Administrador</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Phone className="h-3 w-3 text-green-600" />
              <span className="text-sm text-green-700">(16) 99745-2118</span>
            </div>
          </div>
          
          {/* Botões */}
          <div className="space-y-2">
            <Button 
              onClick={handleWhatsAppContact}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 rounded-md"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              WhatsApp
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleTryAgain}
                className="flex-1 text-xs py-2"
              >
                Tentar Novamente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAlert(false)}
                className="flex-1 text-xs py-2"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
