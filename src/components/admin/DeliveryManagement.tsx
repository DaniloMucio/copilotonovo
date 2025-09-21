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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveryStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{deliveryStats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{deliveryStats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{deliveryStats.completed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestão de Entregas
          </CardTitle>
          <CardDescription>
            Gerencie todas as entregas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar entregas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Confirmada">Confirmada</SelectItem>
                <SelectItem value="A caminho">A caminho</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
                <SelectItem value="Recusada">Recusada</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {filteredDeliveries.length} entregas
            </Badge>
          </div>

          {/* Lista de entregas */}
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleDeliveryClick(delivery)}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(delivery.deliveryStatus || 'Pendente')}
                    <p className="font-medium">{delivery.description}</p>
                    {getStatusBadge(delivery.deliveryStatus || 'Pendente')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                    <p className="font-semibold text-lg">
                      R$ {delivery.amount?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {delivery.paymentType || 'À vista'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredDeliveries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma entrega encontrada</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes da entrega */}
      <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
        <DialogContent className="max-w-2xl" aria-describedby="delivery-details-description">
          <DialogHeader>
            <DialogTitle>Detalhes da Entrega</DialogTitle>
            <DialogDescription id="delivery-details-description">
              Visualize as informações completas da entrega selecionada
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="text-lg">{selectedDelivery.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedDelivery.deliveryStatus || 'Pendente')}
                    {getStatusBadge(selectedDelivery.deliveryStatus || 'Pendente')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor</label>
                  <p className="text-lg font-semibold">
                    R$ {selectedDelivery.amount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Forma de Pagamento</label>
                  <p className="text-lg">{selectedDelivery.paymentType || 'À vista'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data</label>
                  <p className="text-lg">
                    {format(selectedDelivery.date instanceof Timestamp ? selectedDelivery.date.toDate() : selectedDelivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status do Pagamento</label>
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
