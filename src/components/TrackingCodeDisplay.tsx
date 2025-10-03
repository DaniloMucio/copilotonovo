'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Copy, 
  ExternalLink, 
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTrackingDataById, createTrackingData } from '@/services/tracking';

interface TrackingCodeDisplayProps {
  transactionId: string;
  className?: string;
}

export function TrackingCodeDisplay({ transactionId, className = '' }: TrackingCodeDisplayProps) {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const { toast } = useToast();

  const handleGetTrackingCode = async () => {
    setLoading(true);
    try {
      let data = await getTrackingDataById(transactionId);
      
      // Se não existir dados de rastreamento, criar automaticamente
      if (!data) {
        console.log('📦 Dados de rastreamento não encontrados, criando automaticamente...');
        
        // Buscar dados da transação para criar rastreamento
        const { getTransactionById } = await import('@/services/transactions');
        const transaction = await getTransactionById(transactionId);
        
        if (transaction) {
          // Criar dados de rastreamento automaticamente
          data = await createTrackingData(transaction);
          console.log('✅ Dados de rastreamento criados automaticamente');
        }
      }
      
      if (data) {
        setTrackingData(data);
        setShowCode(true);
        toast({
          title: 'Código de rastreamento encontrado!',
          description: 'Use este código para acompanhar a entrega.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível criar o código de rastreamento para esta entrega.'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar/criar código de rastreamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível buscar o código de rastreamento.'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingCode = () => {
    if (trackingData?.trackingCode) {
      navigator.clipboard.writeText(trackingData.trackingCode);
      toast({
        title: 'Código copiado!',
        description: 'Código de rastreamento copiado para a área de transferência.'
      });
    }
  };

  const copyTrackingLink = () => {
    if (trackingData?.trackingCode) {
      const url = `${window.location.origin}/rastreio?code=${trackingData.trackingCode}`;
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copiado!',
        description: 'Link de rastreamento copiado para a área de transferência.'
      });
    }
  };

  const openTrackingPage = () => {
    if (trackingData?.trackingCode) {
      window.open(`/rastreio?code=${trackingData.trackingCode}`, '_blank');
    }
  };

  return (
    <Card className={`border-green-200 bg-green-50/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg font-semibold text-green-800">
              Rastreamento
            </CardTitle>
          </div>
          {trackingData && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {trackingData.status}
            </Badge>
          )}
        </div>
        <CardDescription className="text-green-700">
          Código único para acompanhar o status da entrega
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!trackingData ? (
          <Button
            onClick={handleGetTrackingCode}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Buscando código...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Obter Código de Rastreamento
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Código de Rastreamento */}
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Código de Rastreamento:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCode(!showCode)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {showCode ? (
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-lg font-bold text-gray-800">
                    {trackingData.trackingCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyTrackingCode}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="bg-gray-100 px-3 py-2 rounded">
                  <span className="text-gray-500">••••••••</span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={openTrackingPage}
                variant="outline"
                className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Rastreamento
              </Button>
              
              <Button
                onClick={copyTrackingLink}
                variant="outline"
                className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>

            {/* Status Atual */}
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status Atual:</span>
                <Badge className={`${
                  trackingData.status === 'Entregue' ? 'bg-green-100 text-green-800' :
                  trackingData.status === 'A caminho' ? 'bg-blue-100 text-blue-800' :
                  trackingData.status === 'Confirmada' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {trackingData.status}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
