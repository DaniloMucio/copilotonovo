'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package,
  User,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getTrackingDataByCode, updateTrackingStatus } from '@/services/tracking';

// Interface para dados de rastreamento
interface TrackingData {
  id: string;
  trackingCode: string;
  status: 'Pendente' | 'Confirmada' | 'A caminho' | 'Entregue' | 'Recusada';
  recipientName: string;
  recipientAddress: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  driverName?: string;
  driverPhone?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    description?: string;
  }>;
}

function TrackingPageContent() {
  const searchParams = useSearchParams();
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async () => {
    if (!trackingCode.trim()) {
      setError('Por favor, insira um código de rastreamento');
      return;
    }

    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      // Buscar dados reais do Firebase
      const data = await getTrackingDataByCode(trackingCode.toUpperCase());
      
      if (!data) {
        setError('Código de rastreamento não encontrado. Verifique o código e tente novamente.');
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível encontrar a entrega.'
        });
        return;
      }

      setTrackingData(data);
      setAutoRefresh(true);
      toast({
        title: 'Entrega encontrada!',
        description: 'Status atualizado com sucesso.'
      });
    } catch (err) {
      console.error('Erro ao buscar dados de rastreamento:', err);
      setError('Erro ao buscar dados de rastreamento. Tente novamente.');
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível conectar ao servidor.'
      });
    } finally {
      setLoading(false);
    }
  }, [trackingCode, toast]);

  // Ler parâmetro 'code' da URL e preencher automaticamente
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setTrackingCode(codeFromUrl);
      // Buscar automaticamente se o código estiver na URL
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  }, [searchParams, handleSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'A caminho':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Entregue':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Recusada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendente':
        return <Clock className="h-4 w-4" />;
      case 'Confirmada':
        return <CheckCircle className="h-4 w-4" />;
      case 'A caminho':
        return <Truck className="h-4 w-4" />;
      case 'Entregue':
        return <Package className="h-4 w-4" />;
      case 'Recusada':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyTrackingLink = () => {
    const url = `${window.location.origin}/rastreio?code=${trackingCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copiado!',
      description: 'Link de rastreamento copiado para a área de transferência.'
    });
  };

  // Efeito para atualização automática
  useEffect(() => {
    if (autoRefresh && trackingCode) {
      refreshInterval.current = setInterval(async () => {
        try {
          const data = await getTrackingDataByCode(trackingCode.toUpperCase());
          if (data) {
            setTrackingData(data);
          }
        } catch (error) {
          console.error('Erro na atualização automática:', error);
        }
      }, 30000); // Atualizar a cada 30 segundos
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh, trackingCode]);

  // Efeito para limpar interval ao desmontar
  useEffect(() => {
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Co-Piloto Driver
                  </h1>
                </div>
              </motion.div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-6">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
            >
              <Truck className="h-10 w-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Rastrear <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Entrega</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Digite o código de rastreamento para acompanhar o status da sua entrega em tempo real
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Digite o código de rastreamento (ex: ABC123)"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    className="text-lg py-6 px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl"
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={loading || !trackingCode.trim()}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Rastrear
                    </>
                  )}
                </Button>
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                >
                  {error}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {trackingData && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Status Card */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Status da Entrega
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Código: {trackingData.trackingCode}
                      </CardDescription>
                    </div>
                    <Badge className={`px-4 py-2 text-sm font-semibold border ${getStatusColor(trackingData.status)}`}>
                      {getStatusIcon(trackingData.status)}
                      <span className="ml-2">{trackingData.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delivery Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-gray-500 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900">Destinatário</p>
                          <p className="text-gray-600">{trackingData.recipientName}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900">Endereço</p>
                          <p className="text-gray-600">{trackingData.recipientAddress}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-gray-500 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900">Data de Criação</p>
                          <p className="text-gray-600">{formatDate(trackingData.createdAt)}</p>
                        </div>
                      </div>
                      {trackingData.estimatedDelivery && (
                        <div className="flex items-start space-x-3">
                          <Clock className="h-5 w-5 text-gray-500 mt-1" />
                          <div>
                            <p className="font-semibold text-gray-900">Previsão de Entrega</p>
                            <p className="text-gray-600">{formatDate(trackingData.estimatedDelivery)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Driver Info */}
                  {trackingData.driverName && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Informações do Motorista</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{trackingData.driverName}</p>
                          <p className="text-sm text-gray-600">{trackingData.driverPhone}</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Contatar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Share Button and Auto Refresh Indicator */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                      onClick={copyTrackingLink}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar Rastreamento
                    </Button>
                    
                    {autoRefresh && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <RefreshCw className="h-4 w-4 animate-spin text-green-600" />
                        <span>Atualização automática ativa</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Status History */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Histórico de Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingData.statusHistory.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex items-start space-x-4"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900">{item.status}</p>
                            <p className="text-sm text-gray-500">{formatDate(item.timestamp)}</p>
                          </div>
                          {item.description && (
                            <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold">Co-Piloto Driver</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 Co-Piloto Driver. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Carregando rastreamento...</p>
        </div>
      </div>
    }>
      <TrackingPageContent />
    </Suspense>
  );
}
