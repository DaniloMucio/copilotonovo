
'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from '@/lib/firebase';
import { getCurrentMonthDeliveriesByClient, deleteTransaction, type Transaction } from '@/services/transactions';
import { getUserDocument, type UserData } from '@/services/firestore';
import { 
  Package, 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { Timestamp } from 'firebase/firestore';

interface ClienteDashboardProps {
  canInstall?: boolean;
  install?: () => void;
}

function ClienteDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClienteDashboard({ canInstall = false, install = () => {} }: ClienteDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // PWA hook
  const { canInstall: pwaCanInstall, installApp: pwaInstall } = usePWAInstall();
  
  // Auto refresh hook
  const { refreshData, refreshWithDelay } = useAutoRefresh();

  const fetchUserData = useCallback(async (uid: string) => {
    const data = await getUserDocument(uid);
    if (data) setUserData(data);
  }, []);

  const fetchTransactions = useCallback(async (uid: string) => {
    // Para clientes, buscar entregas do mês atual pelo clientId
    if (userData?.userType === 'cliente') {
      const clientDeliveries = await getCurrentMonthDeliveriesByClient(uid);
      setTransactions(clientDeliveries);
    } else {
      // Para outros tipos de usuário, usar a função padrão (não deveria acontecer no dashboard cliente)
      console.warn("Tipo de usuário não é cliente no dashboard cliente");
      setTransactions([]);
    }
  }, [userData?.userType]);

  const refreshAllData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      // Primeiro carregar os dados do usuário
      await fetchUserData(uid);
      // Depois carregar as transações (que depende do userData)
      await fetchTransactions(uid);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard.'
      });
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, fetchTransactions, toast]);

  const handleDeleteDelivery = async (deliveryId: string) => {
    try {
      await deleteTransaction(deliveryId);
      toast({
        title: 'Sucesso!',
        description: 'Entrega excluída com sucesso.'
      });
      // Recarregar os dados após exclusão
      if (user) {
        refreshWithDelay(() => refreshAllData(user.uid));
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
        await refreshAllData(currentUser.uid);
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, refreshAllData]);

  if (loading) {
    return <ClienteDashboardSkeleton />;
  }

  if (!user || !userData) {
    return null;
  }



  // Filtrar transações relevantes para clientes
  const deliveryTransactions = transactions.filter(t => t.category === 'Entrega');
  const pendingDeliveries = deliveryTransactions.filter(d => d.deliveryStatus === 'Pendente');
  const completedDeliveries = deliveryTransactions.filter(d => d.deliveryStatus === 'Entregue');
  const totalSpent = deliveryTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Estatísticas
  const stats = [
    {
      title: "Entregas Pendentes",
      value: pendingDeliveries.length.toString(),
      icon: ClockIcon,
      description: "Aguardando confirmação",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "Entregas Concluídas",
      value: completedDeliveries.length.toString(),
      icon: CheckCircle,
      description: "Total realizadas",
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Total Investido",
      value: `R$ ${totalSpent.toFixed(2)}`,
      icon: DollarSign,
      description: "Em entregas",
      color: "text-blue-600 dark:text-blue-400"
    }
  ];

  // Entregas recentes
  const recentDeliveries = deliveryTransactions
    .sort((a, b) => {
      const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
      const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header com PWA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Cliente</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {userData.displayName || user.email}! Acompanhe suas entregas e agendamentos.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {userData && (<Badge variant="outline" className="text-sm font-medium capitalize">Perfil: {userData.userType}</Badge>)}
            <PWAInstallButton canInstall={pwaCanInstall} install={pwaInstall} />
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="deliveries">Entregas (Mês Atual)</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entregas Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Entregas Recentes
                </CardTitle>
                <CardDescription>
                  Acompanhe o status das suas últimas entregas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentDeliveries.length > 0 ? (
                  <div className="space-y-3">
                    {recentDeliveries.map((delivery) => (
                      <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{delivery.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={delivery.deliveryStatus === 'Entregue' ? 'default' : 'secondary'}
                          >
                            {delivery.deliveryStatus}
                          </Badge>
                          {delivery.deliveryStatus === 'Pendente' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-3 w-3" />
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
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma entrega encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo Financeiro
                </CardTitle>
                <CardDescription>
                  Visão geral dos seus gastos com entregas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total em Entregas:</span>
                    <span className="font-semibold">R$ {totalSpent.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Entregas Pendentes:</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {pendingDeliveries.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Entregas Concluídas:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {completedDeliveries.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Entregas */}
        <TabsContent value="deliveries" className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Dados do mês atual - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Entregas do Mês Atual
              </CardTitle>
              <CardDescription>
                Entregas registradas no mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryTransactions.length > 0 ? (
                <div className="space-y-3">
                  {deliveryTransactions
                    .sort((a, b) => {
                      const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
                      const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((delivery) => (
                      <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-medium">{delivery.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Local da entrega
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={delivery.deliveryStatus === 'Entregue' ? 'default' : 'secondary'}
                          >
                            {delivery.deliveryStatus}
                          </Badge>
                          <span className="font-semibold text-sm">
                            R$ {delivery.amount?.toFixed(2) || '0.00'}
                          </span>
                          {delivery.deliveryStatus === 'Pendente' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-3 w-3" />
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
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma entrega encontrada</p>
                  <p className="text-sm">Suas entregas aparecerão aqui quando forem criadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agenda */}
        <TabsContent value="agenda" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agenda e Compromissos
              </CardTitle>
              <CardDescription>
                Gerencie seus agendamentos e compromissos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Funcionalidade em Desenvolvimento</p>
                <p className="text-sm">Em breve você poderá gerenciar sua agenda aqui</p>
                <Button 
                  className="mt-4" 
                  onClick={() => router.push('/dashboard/agenda')}
                >
                  Ir para Agenda Completa
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ClienteDashboardPage() {
  return (
    <Suspense fallback={<ClienteDashboardSkeleton />}>
      <ClienteDashboard />
    </Suspense>
  );
}
