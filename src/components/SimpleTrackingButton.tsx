'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  ExternalLink, 
  MessageCircle,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTrackingDataById } from '@/services/tracking';
import { getCompanyData, generateDefaultWhatsAppMessage } from '@/services/company';

interface SimpleTrackingButtonProps {
  transactionId: string;
  className?: string;
  onClose?: () => void;
}

export function SimpleTrackingButton({ transactionId, className = '', onClose }: SimpleTrackingButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(true); // Sempre aberto quando chamado
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOpenModal = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTrackingDataById(transactionId);
      if (data) {
        setTrackingData(data);
        setIsModalOpen(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Código de rastreamento não encontrado para esta entrega.'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados de rastreamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível buscar o código de rastreamento.'
      });
    } finally {
      setLoading(false);
    }
  }, [transactionId, toast]);

  // Carregar dados automaticamente quando o componente é montado
  useEffect(() => {
    handleOpenModal();
  }, [handleOpenModal]);

  const handleOpenTracking = () => {
    if (trackingData?.trackingCode) {
      window.open(`/rastreio?code=${trackingData.trackingCode}`, '_blank');
    }
  };

  const handleShareWhatsApp = async () => {
    if (trackingData?.trackingCode && trackingData?.recipientPhone) {
      try {
        // Buscar dados da empresa
        const companyData = await getCompanyData();
        
        // Gerar mensagem personalizada
        const message = companyData?.whatsappMessage || 
          generateDefaultWhatsAppMessage(
            trackingData.trackingCode,
            trackingData.recipientName,
            trackingData.status,
            trackingData.senderCompany // Usar o nome da empresa remetente
          );

        const phone = trackingData.recipientPhone.replace(/\D/g, ''); // Remove caracteres não numéricos
        const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        toast({
          title: 'WhatsApp aberto!',
          description: 'Mensagem preparada para envio.'
        });
      } catch (error) {
        console.error('Erro ao gerar mensagem WhatsApp:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível gerar a mensagem.'
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Telefone do destinatário não encontrado.'
      });
    }
  };

  return (
    <>
      {/* Modal simples com 3 opções */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-4 sm:p-6 relative mx-4 sm:mx-0">
            {/* Botão fechar */}
            <Button
              onClick={() => {
                setIsModalOpen(false);
                if (onClose) onClose();
              }}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Rastreamento</h3>
                <p className="text-sm text-gray-600">Escolha uma opção</p>
              </div>
            </div>

            {/* Opções */}
            <div className="space-y-3">
              <Button
                onClick={handleOpenTracking}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium"
                disabled={!trackingData || loading}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Rastreamento
              </Button>

              {trackingData?.recipientPhone && (
                <Button
                  onClick={handleShareWhatsApp}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50 py-3 text-base font-medium"
                  disabled={!trackingData || loading}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Compartilhar via WhatsApp
                </Button>
              )}

              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onClose) onClose();
                }}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-base font-medium"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
