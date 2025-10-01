'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { getPendingDeliveriesForDriver, getAllDeliveriesForDriver, updateTransaction, deleteTransaction, type Transaction } from '@/services/transactions';
import { getUserDocument, type UserData } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Check,
  X,
  Trash2
} from 'lucide-react';

function EntregasPendentesSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-6 w-1/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EntregasPendentesContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pendingDeliveries, setPendingDeliveries] = useState<Transaction[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      // Para entregas pendentes, buscar todas independente da data
      // Para todas as entregas, manter o filtro normal
      const [pending, all] = await Promise.all([
        getPendingDeliveriesForDriver(uid),
        getAllDeliveriesForDriver(uid)
      ]);
      
      setPendingDeliveries(pending);
      setAllDeliveries(all);
    } catch (error) {
      console.error("Erro ao buscar entregas:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: 'Não foi possível carregar as entregas.'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleDeliveryResponse = async (deliveryId: string, accept: boolean) => {
    try {
      const status = accept ? 'Confirmada' : 'Recusada';
      await updateTransaction(deliveryId, { deliveryStatus: status as any });
      
      toast({ 
        title: 'Sucesso!', 
        description: `Entrega ${accept ? 'aceita' : 'recusada'} com sucesso.` 
      });
      
      // Recarregar dados
      if (user) {
        await fetchData(user.uid);
      }
    } catch (error) {
      console.error("Erro ao processar entrega:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: 'Não foi possível processar a entrega.'
      });
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta entrega pendente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteTransaction(deliveryId);
      
      toast({ 
        title: 'Sucesso!', 
        description: 'Entrega excluída com sucesso.' 
      });
      
      // Recarregar dados
      if (user) {
        await fetchData(user.uid);
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
        if (data && data.userType === 'motorista') {
          setUserData(data);
          await fetchData(currentUser.uid);
        } else {
          toast({
            variant: 'destructive',
            title: 'Acesso Negado',
            description: 'Esta página é exclusiva para motoristas.'
          });
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, fetchData, toast]);

  if (loading) {
    return <EntregasPendentesSkeleton />;
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minhas Entregas</h1>
        <p className="text-muted-foreground">
          Gerencie suas entregas pendentes e histórico
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingDeliveries.length}</div>
            <p className="text-xs text-muted-foreground">Aguardando resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{allDeliveries.length}</div>
            <p className="text-xs text-muted-foreground">Todas as entregas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allDeliveries.filter(d => d.deliveryStatus === 'Confirmada').length}
            </div>
            <p className="text-xs text-muted-foreground">Entregas aceitas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Entregas */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        {/* Entregas Pendentes */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Entregas Pendentes
              </CardTitle>
              <CardDescription>
                Entregas aguardando sua confirmação ou recusa
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
                              {delivery.recipientAddress?.city || 'Local não informado'}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              R$ {delivery.amount?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          {delivery.observations && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Observações:</strong> {delivery.observations}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge variant="secondary" className="text-orange-600 border-orange-200">
                            {delivery.deliveryStatus}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDeliveryResponse(delivery.id!, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeliveryResponse(delivery.id!, false)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Recusar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDelivery(delivery.id!)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

        {/* Todas as Entregas */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Todas as Entregas
              </CardTitle>
              <CardDescription>
                Histórico completo de todas as suas entregas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allDeliveries.length > 0 ? (
                <div className="space-y-4">
                  {allDeliveries.map((delivery) => (
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
                              {delivery.recipientAddress?.city || 'Local não informado'}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              R$ {delivery.amount?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge 
                            variant={delivery.deliveryStatus === 'Confirmada' ? 'default' : 
                                   delivery.deliveryStatus === 'Recusada' ? 'destructive' : 'secondary'}
                          >
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
                  <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma entrega encontrada</p>
                  <p className="text-sm">Suas entregas aparecerão aqui quando forem atribuídas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EntregasPendentesPage() {
  return (
    <Suspense fallback={<EntregasPendentesSkeleton />}>
      <EntregasPendentesContent />
    </Suspense>
  );
}
