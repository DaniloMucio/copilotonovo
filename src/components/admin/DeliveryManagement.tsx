'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Package, 
  Search, 
  Eye, 
  Edit, 
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { getAllDeliveries, getDeliveryStats, type DeliveryStats } from '@/services/admin';
import { type Transaction } from '@/services/transactions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface DeliveryManagementProps {
  onDeliverySelect?: (delivery: Transaction) => void;
}

export function DeliveryManagement({ onDeliverySelect }: DeliveryManagementProps) {
  const [deliveries, setDeliveries] = useState<Transaction[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Transaction[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deliveriesData, statsData] = await Promise.all([
          getAllDeliveries(),
          getDeliveryStats()
        ]);
        setDeliveries(deliveriesData);
        setFilteredDeliveries(deliveriesData);
        setDeliveryStats(statsData);
      } catch (error) {
        console.error('Erro ao buscar entregas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = deliveries;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(delivery => 
        delivery.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.senderCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.recipientCompany?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.deliveryStatus === statusFilter);
    }

    setFilteredDeliveries(filtered);
  }, [searchTerm, statusFilter, deliveries]);

  const handleDeliveryClick = (delivery: Transaction) => {
    setSelectedDelivery(delivery);
    onDeliverySelect?.(delivery);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Entregue':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Pendente':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'A caminho':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'Recusada':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Entregue': 'default',
      'Pendente': 'secondary',
      'A caminho': 'outline',
      'Recusada': 'destructive',
      'Confirmada': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {deliveryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="h-3 w-3 text-white" />
                </div>
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gray-900">{deliveryStats.total}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-3 w-3 text-white" />
                </div>
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-orange-600">{deliveryStats.pending}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
                  <Truck className="h-3 w-3 text-white" />
                </div>
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-blue-600">{deliveryStats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-green-600">{deliveryStats.completed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            Gestão de Entregas
          </CardTitle>
          <CardDescription className="text-gray-600">
            Gerencie todas as entregas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar entregas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-white border-gray-300 text-gray-900 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-0 shadow-2xl rounded-2xl">
                <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">Todos os status</SelectItem>
                <SelectItem value="Pendente" className="text-gray-900 hover:bg-gray-50">Pendente</SelectItem>
                <SelectItem value="Confirmada" className="text-gray-900 hover:bg-gray-50">Confirmada</SelectItem>
                <SelectItem value="A caminho" className="text-gray-900 hover:bg-gray-50">A caminho</SelectItem>
                <SelectItem value="Entregue" className="text-gray-900 hover:bg-gray-50">Entregue</SelectItem>
                <SelectItem value="Recusada" className="text-gray-900 hover:bg-gray-50">Recusada</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 border-0 rounded-full shadow-sm">
              {filteredDeliveries.length} entregas
            </Badge>
          </div>

          {/* Lista de entregas */}
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer"
                onClick={() => handleDeliveryClick(delivery)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex items-center justify-between p-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(delivery.deliveryStatus || 'Pendente')}
                      <p className="font-medium text-gray-900">{delivery.description}</p>
                      {getStatusBadge(delivery.deliveryStatus || 'Pendente')}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                      {delivery.senderCompany && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {delivery.senderCompany}
                        </span>
                      )}
                      {delivery.recipientCompany && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {delivery.recipientCompany}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold text-lg text-gray-900">
                        R$ {delivery.amount?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {delivery.paymentType || 'À vista'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDeliveries.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg font-medium text-gray-900">Nenhuma entrega encontrada</p>
              <p className="text-sm text-gray-600">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes da entrega */}
      <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
        <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl rounded-2xl" aria-describedby="delivery-details-description">
          <DialogHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 p-6 rounded-t-2xl">
            <DialogTitle className="text-gray-900">Detalhes da Entrega</DialogTitle>
            <DialogDescription id="delivery-details-description" className="text-gray-600">
              Visualize as informações completas da entrega selecionada
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Descrição</label>
                  <p className="text-lg text-gray-900">{selectedDelivery.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedDelivery.deliveryStatus || 'Pendente')}
                    {getStatusBadge(selectedDelivery.deliveryStatus || 'Pendente')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Valor</label>
                  <p className="text-lg font-semibold text-gray-900">
                    R$ {selectedDelivery.amount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Forma de Pagamento</label>
                  <p className="text-lg text-gray-900">{selectedDelivery.paymentType || 'À vista'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Data</label>
                  <p className="text-lg text-gray-900">
                    {format(selectedDelivery.date instanceof Timestamp ? selectedDelivery.date.toDate() : selectedDelivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status do Pagamento</label>
                  <Badge variant={selectedDelivery.paymentStatus === 'Pago' ? 'default' : 'secondary'}>
                    {selectedDelivery.paymentStatus || 'Pendente'}
                  </Badge>
                </div>
              </div>

              {(selectedDelivery.senderCompany || selectedDelivery.recipientCompany) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Empresas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedDelivery.senderCompany && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Remetente</label>
                        <p className="text-lg">{selectedDelivery.senderCompany}</p>
                      </div>
                    )}
                    {selectedDelivery.recipientCompany && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Destinatário</label>
                        <p className="text-lg">{selectedDelivery.recipientCompany}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDelivery.observations && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Observações</h4>
                  <p className="text-sm text-muted-foreground">{selectedDelivery.observations}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedDelivery(null)}>
                  Fechar
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Entrega
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
