'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  X, 
  Eye, 
  Edit, 
  Trash2,
  Search,
  Filter,
  MapPin,
  User,
  Building,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllDeliveries, updateDeliveryStatus, deleteDelivery } from '@/services/admin';
import { updateTransaction } from '@/services/transactions';
import { Transaction } from '@/services/transactions';
import { motion } from 'framer-motion';

export function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState<Transaction[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Estados do formulário de edição
  const [editForm, setEditForm] = useState({
    description: '',
    amount: 0,
    deliveryStatus: 'Pendente' as 'Pendente' | 'Confirmada' | 'A caminho' | 'Entregue' | 'Recusada',
    paymentStatus: 'Pendente' as 'Pendente' | 'Pago',
    paymentType: 'À vista' as 'À vista' | 'A receber',
    senderCompany: '',
    recipientCompany: '',
    observations: ''
  });

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const deliveriesData = await getAllDeliveries();
      setDeliveries(deliveriesData);
      setFilteredDeliveries(deliveriesData);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar entregas',
        description: 'Não foi possível carregar as entregas.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Filtrar entregas
  useEffect(() => {
    let filtered = deliveries;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(delivery => 
        delivery.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.senderCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.recipientCompany?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.deliveryStatus === statusFilter);
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, searchTerm, statusFilter]);

  const handleViewDetails = (delivery: Transaction) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const handleEditDelivery = (delivery: Transaction) => {
    setSelectedDelivery(delivery);
    setEditForm({
      description: delivery.description,
      amount: delivery.amount,
      deliveryStatus: delivery.deliveryStatus || 'Pendente',
      paymentStatus: delivery.paymentStatus || 'Pendente',
      paymentType: delivery.paymentType || 'A receber',
      senderCompany: delivery.senderCompany || '',
      recipientCompany: delivery.recipientCompany || '',
      observations: delivery.observations || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateDelivery = async () => {
    if (!selectedDelivery) return;

    setIsProcessing(true);
    try {
      await updateTransaction(selectedDelivery.id, {
        description: editForm.description,
        amount: editForm.amount,
        deliveryStatus: editForm.deliveryStatus,
        paymentStatus: editForm.paymentStatus,
        paymentType: editForm.paymentType,
        senderCompany: editForm.senderCompany,
        recipientCompany: editForm.recipientCompany,
        observations: editForm.observations
      });

      toast({
        title: 'Entrega atualizada',
        description: 'A entrega foi atualizada com sucesso.',
      });

      await fetchDeliveries();
      setShowEditModal(false);
      setSelectedDelivery(null);
    } catch (error) {
      console.error('Erro ao atualizar entrega:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar entrega',
        description: 'Não foi possível atualizar a entrega.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDelivery = (delivery: Transaction) => {
    setSelectedDelivery(delivery);
    setShowDeleteDialog(true);
  };

  const confirmDeleteDelivery = async () => {
    if (!selectedDelivery) return;

    setIsProcessing(true);
    try {
      await deleteDelivery(selectedDelivery.id);
      
      toast({
        title: 'Entrega excluída',
        description: 'A entrega foi excluída com sucesso.',
      });

      await fetchDeliveries();
      setShowDeleteDialog(false);
      setSelectedDelivery(null);
    } catch (error) {
      console.error('Erro ao excluir entrega:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir entrega',
        description: 'Não foi possível excluir a entrega.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-orange-100 text-orange-800 border-orange-200';
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
        return <CheckCircle className="h-4 w-4" />;
      case 'Recusada':
        return <X className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Entregas</h2>
            <p className="text-gray-600">Monitore e gerencie todas as entregas do sistema</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Entregas</h2>
          <p className="text-gray-600">Monitore e gerencie todas as entregas do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredDeliveries.length} entregas
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por descrição, empresa remetente ou destinatária..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all" className="hover:bg-gray-50">Todos os status</SelectItem>
                <SelectItem value="Pendente" className="hover:bg-gray-50">Pendente</SelectItem>
                <SelectItem value="Confirmada" className="hover:bg-gray-50">Confirmada</SelectItem>
                <SelectItem value="A caminho" className="hover:bg-gray-50">A caminho</SelectItem>
                <SelectItem value="Entregue" className="hover:bg-gray-50">Entregue</SelectItem>
                <SelectItem value="Recusada" className="hover:bg-gray-50">Recusada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Lista de Entregas */}
      <div className="space-y-4">
        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery, index) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {delivery.description}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            <span>De: {delivery.senderCompany || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            <span>Para: {delivery.recipientCompany || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(delivery.deliveryStatus || 'Pendente')} flex items-center gap-1`}>
                          {getStatusIcon(delivery.deliveryStatus || 'Pendente')}
                          {delivery.deliveryStatus || 'Pendente'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          R$ {delivery.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>
                          {format(
                            delivery.date instanceof Date ? delivery.date : delivery.date.toDate(),
                            'dd/MM/yyyy',
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Pagamento:</span>
                        <span className="font-medium">{delivery.paymentType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          delivery.paymentStatus === 'Pago' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {delivery.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(delivery)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDelivery(delivery)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDelivery(delivery)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card className="p-8 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Nenhuma entrega encontrada' : 'Nenhuma entrega cadastrada'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'As entregas aparecerão aqui quando forem criadas.'
              }
            </p>
          </Card>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhes da Entrega
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre a entrega selecionada
            </DialogDescription>
          </DialogHeader>

          {selectedDelivery && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Descrição</Label>
                  <p className="text-gray-900 font-medium">{selectedDelivery.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Valor</Label>
                  <p className="text-green-600 font-bold text-lg">R$ {selectedDelivery.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status da Entrega</Label>
                  <Badge className={`${getStatusColor(selectedDelivery.deliveryStatus || 'Pendente')} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(selectedDelivery.deliveryStatus || 'Pendente')}
                    {selectedDelivery.deliveryStatus || 'Pendente'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status do Pagamento</Label>
                  <Badge variant={(selectedDelivery.paymentStatus || 'Pendente') === 'Pago' ? 'default' : 'secondary'}>
                    {selectedDelivery.paymentStatus || 'Pendente'}
                  </Badge>
                </div>
              </div>

              {/* Empresas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Empresa Remetente</Label>
                  <p className="text-gray-900">{selectedDelivery.senderCompany || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Empresa Destinatária</Label>
                  <p className="text-gray-900">{selectedDelivery.recipientCompany || 'N/A'}</p>
                </div>
              </div>

              {/* Endereços */}
              {(selectedDelivery.senderAddress || selectedDelivery.recipientAddress) && (
                <div className="space-y-4">
                  {selectedDelivery.senderAddress && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Endereço de Origem</Label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900">
                          {selectedDelivery.senderAddress.street}, {selectedDelivery.senderAddress.number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedDelivery.senderAddress.neighborhood} - {selectedDelivery.senderAddress.city}
                        </p>
                        <p className="text-sm text-gray-600">
                          CEP: {selectedDelivery.senderAddress.cep}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedDelivery.recipientAddress && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Endereço de Destino</Label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900">
                          {selectedDelivery.recipientAddress.street}, {selectedDelivery.recipientAddress.number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedDelivery.recipientAddress.neighborhood} - {selectedDelivery.recipientAddress.city}
                        </p>
                        <p className="text-sm text-gray-600">
                          CEP: {selectedDelivery.recipientAddress.cep}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Observações */}
              {selectedDelivery.observations && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Observações</Label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedDelivery.observations}
                  </p>
                </div>
              )}

              {/* Data */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Data de Criação</Label>
                <p className="text-gray-900">
                  {format(
                    selectedDelivery.date instanceof Date ? selectedDelivery.date : selectedDelivery.date.toDate(),
                    'dd/MM/yyyy HH:mm',
                    { locale: ptBR }
                  )}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setShowDetailsModal(false);
              handleEditDelivery(selectedDelivery!);
            }}>
              Editar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Entrega
            </DialogTitle>
            <DialogDescription>
              Modifique as informações da entrega
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryStatus">Status da Entrega</Label>
                <Select
                  value={editForm.deliveryStatus}
                  onValueChange={(value: any) => setEditForm({ ...editForm, deliveryStatus: value })}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="Pendente" className="hover:bg-gray-50">Pendente</SelectItem>
                    <SelectItem value="Confirmada" className="hover:bg-gray-50">Confirmada</SelectItem>
                    <SelectItem value="A caminho" className="hover:bg-gray-50">A caminho</SelectItem>
                    <SelectItem value="Entregue" className="hover:bg-gray-50">Entregue</SelectItem>
                    <SelectItem value="Recusada" className="hover:bg-gray-50">Recusada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">Status do Pagamento</Label>
                <Select
                  value={editForm.paymentStatus}
                  onValueChange={(value: any) => setEditForm({ ...editForm, paymentStatus: value })}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="Pendente" className="hover:bg-gray-50">Pendente</SelectItem>
                    <SelectItem value="Pago" className="hover:bg-gray-50">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentType">Tipo de Pagamento</Label>
              <Select
                value={editForm.paymentType}
                onValueChange={(value: any) => setEditForm({ ...editForm, paymentType: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="À vista" className="hover:bg-gray-50">À vista</SelectItem>
                  <SelectItem value="A receber" className="hover:bg-gray-50">A receber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="senderCompany">Empresa Remetente</Label>
                <Input
                  id="senderCompany"
                  value={editForm.senderCompany}
                  onChange={(e) => setEditForm({ ...editForm, senderCompany: e.target.value })}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="recipientCompany">Empresa Destinatária</Label>
                <Input
                  id="recipientCompany"
                  value={editForm.recipientCompany}
                  onChange={(e) => setEditForm({ ...editForm, recipientCompany: e.target.value })}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={editForm.observations}
                onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
                rows={3}
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDelivery} disabled={isProcessing}>
              {isProcessing ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entrega? Esta ação não pode ser desfeita.
              <br />
              <br />
              <strong>Entrega:</strong> {selectedDelivery?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDelivery}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}