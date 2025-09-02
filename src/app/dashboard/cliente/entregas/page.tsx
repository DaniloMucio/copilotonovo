
'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/firebase';
import { getCurrentMonthDeliveriesByClient, deleteTransaction, type Transaction, updateTransaction } from '@/services/transactions';
import { getUserDocument, type UserData, getOnlineDrivers } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Truck,
  User as UserIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { DeliveryForm } from '@/components/forms/DeliveryForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function EntregasClienteSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function EntregasClienteContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pendingDeliveries, setPendingDeliveries] = useState<Transaction[]>([]);
  const [deliveriesToReceive, setDeliveriesToReceive] = useState<Transaction[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [drivers, setDrivers] = useState<(UserData & { uid: string })[]>([]);
  const { toast } = useToast();

  const fetchData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      // Para clientes, buscar entregas do mês atual pelo clientId
      const clientDeliveries = await getCurrentMonthDeliveriesByClient(uid);

      const deliveryTransactions = clientDeliveries.filter(
        (t) => t.category === 'Entrega'
      );
      
      setPendingDeliveries(deliveryTransactions.filter(d => d.deliveryStatus === 'Pendente'));
      setDeliveryHistory(deliveryTransactions.filter(d => d.deliveryStatus !== 'Pendente'));
      setDeliveriesToReceive(deliveryTransactions.filter(
        (d) => d.deliveryStatus === 'Entregue' && d.paymentStatus === 'Pendente'
      ));

    } catch (error) {
      console.error("Erro ao buscar dados de entregas:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: 'Não foi possível carregar os dados de entregas.'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchDrivers = useCallback(async () => {
    try {
      const driversList = await getOnlineDrivers();
      setDrivers(driversList);
    } catch (error) {
      console.error("❌ Erro ao buscar motoristas online:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: 'Não foi possível carregar a lista de motoristas online.'
      });
    }
  }, [toast]);

  

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    if (user) {
      fetchData(user.uid);
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    try {
      await deleteTransaction(deliveryId);
      toast({
        title: 'Sucesso!',
        description: 'Entrega excluída com sucesso.'
      });
      // Recarregar os dados após exclusão
      if (user) {
        fetchData(user.uid);
      }
    } catch (error) {
      console.error("Erro ao excluir entrega:", error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir a entrega.'
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const data = await getUserDocument(currentUser.uid);
        if (data && data.userType === 'cliente') {
          setUserData(data);
          await fetchData(currentUser.uid);
          await fetchDrivers(); // Buscar motoristas
        } else {
          toast({
            variant: 'destructive',
            title: 'Acesso Negado',
            description: 'Esta página é exclusiva para clientes.'
          });
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, fetchData, fetchDrivers, toast]);

  if (loading) {
    return <EntregasClienteSkeleton />;
  }

  if (!user || !userData) {
    return null;
  }

  const totalDeliveries = pendingDeliveries.length + deliveryHistory.length;
  const totalSpent = deliveryHistory.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Entregas</h1>
          <p className="text-muted-foreground">
            Acompanhe o status e histórico das suas entregas
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleOpenForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrega
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">Todas as entregas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingDeliveries.length}</div>
            <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveryHistory.length}</div>
            <p className="text-xs text-muted-foreground">Entregas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">R$ {totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Em entregas concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Entregas */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
        </TabsList>

        {/* Entregas Pendentes */}
        <TabsContent value="pending" className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Dados do mês atual - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Entregas Pendentes (Mês Atual)
              </CardTitle>
              <CardDescription>
                Entregas aguardando confirmação ou em andamento no mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDeliveries.length > 0 ? (
                <div className="space-y-4">
                  {pendingDeliveries.map((delivery) => (
                    <div key={delivery.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium">{delivery.description}</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(delivery.date instanceof Date ? delivery.date : delivery.date.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Local da entrega
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              R$ {delivery.amount?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge variant="secondary" className="text-orange-600 border-orange-200">
                            {delivery.deliveryStatus}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Entrega</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta entrega? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteDelivery(delivery.id!)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma entrega pendente</p>
                  <p className="text-sm">Todas as suas entregas foram processadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entregas Concluídas */}
        <TabsContent value="completed" className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Dados do mês atual - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Entregas Concluídas (Mês Atual)
              </CardTitle>
              <CardDescription>
                Entregas realizadas no mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryHistory.length > 0 ? (
                <div className="space-y-4">
                  {deliveryHistory
                    .sort((a, b) => {
                      const dateA = a.date instanceof Date ? a.date : a.date.toDate();
                      const dateB = b.date instanceof Date ? b.date : b.date.toDate();
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((delivery) => (
                      <div key={delivery.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-medium">{delivery.description}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(delivery.date instanceof Date ? delivery.date : delivery.date.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Local da entrega
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                R$ {delivery.amount?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <Badge variant="default" className="text-green-600 bg-green-100">
                              {delivery.deliveryStatus}
                            </Badge>
                            <Badge variant="outline">
                              {delivery.paymentStatus === 'Pago' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma entrega concluída</p>
                  <p className="text-sm">Suas entregas concluídas aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagamentos Pendentes */}
        <TabsContent value="payment" className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Dados do mês atual - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Pagamentos Pendentes (Mês Atual)
              </CardTitle>
              <CardDescription>
                Entregas concluídas aguardando pagamento no mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveriesToReceive.length > 0 ? (
                <div className="space-y-4">
                  {deliveriesToReceive.map((delivery) => (
                    <div key={delivery.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium">{delivery.description}</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(delivery.date instanceof Date ? delivery.date : delivery.date.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Local da entrega
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              R$ {delivery.amount?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Pagamento Pendente
                          </Badge>
                          <p className="text-sm font-medium text-orange-600">
                            R$ {delivery.amount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum pagamento pendente</p>
                  <p className="text-sm">Todos os seus pagamentos foram processados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal do Formulário de Nova Entrega */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Nova Entrega</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCloseForm}
                >
                  ✕
                </Button>
              </div>
                             <DeliveryForm 
                 onFormSubmit={handleFormSuccess}
                 drivers={drivers} // Lista de motoristas disponíveis
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EntregasClientePage() {
  return (
    <Suspense fallback={<EntregasClienteSkeleton />}>
      <EntregasClienteContent />
    </Suspense>
  );
}
