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
import { getRecipientsByUser, type Recipient } from '@/services/recipients';
import { useToast } from '@/hooks/use-toast';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
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
  Trash2,
  Zap,
  Sparkles
} from 'lucide-react';
import { DeliveryForm } from '@/components/forms/DeliveryForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { OptimizedMotion, OptimizedSkeleton, useOptimizedAnimation } from '@/components/ui/optimized-motion';

function EntregasClienteSkeleton() {
  const { animationProps } = useOptimizedAnimation();
  
  return (
    <div className="space-y-6">
      <OptimizedMotion 
        {...animationProps}
        className="flex items-baseline justify-between"
      >
        <div className="flex items-center space-x-3">
          <OptimizedMotion
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            disableOnMobile={true}
            className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
          >
            <Package className="h-4 w-4 text-white" />
          </OptimizedMotion>
          <OptimizedSkeleton className="h-8 w-1/2" />
        </div>
        <OptimizedSkeleton className="h-4 w-24" />
      </OptimizedMotion>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <OptimizedMotion
            key={i}
            {...animationProps}
            transition={{ ...animationProps.transition, delay: 0.1 * i }}
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <OptimizedSkeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="relative z-10">
                <OptimizedSkeleton className="h-8 w-3/4" />
              </CardContent>
            </Card>
          </OptimizedMotion>
        ))}
      </div>
      
      <OptimizedMotion
        {...animationProps}
        transition={{ ...animationProps.transition, delay: 0.3 }}
      >
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span>Entregas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + 0.1 * i }}
                >
                  <Skeleton className="h-10 w-full" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </OptimizedMotion>
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
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const { toast } = useToast();
  const { animationProps } = useOptimizedAnimation();
  
  // Auto refresh hook
  const { refreshWithDelay } = useAutoRefresh();

  const fetchData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      console.log('🔄 EntregasCliente: fetchData iniciado para uid:', uid);
      
      // Para clientes, buscar entregas do mês atual pelo clientId e destinatários
      const [clientDeliveries, recipientsList] = await Promise.all([
        getCurrentMonthDeliveriesByClient(uid),
        getRecipientsByUser(uid)
      ]);
      
      console.log('📊 EntregasCliente: Entregas recebidas:', clientDeliveries.length);

      const deliveryTransactions = clientDeliveries.filter(
        (t) => t.category === 'Entrega'
      );
      
      setPendingDeliveries(deliveryTransactions.filter(d => d.deliveryStatus === 'Pendente'));
      setDeliveryHistory(deliveryTransactions.filter(d => d.deliveryStatus !== 'Pendente'));
      setDeliveriesToReceive(deliveryTransactions.filter(
        (d) => d.deliveryStatus === 'Entregue' && d.paymentStatus === 'Pendente'
      ));
      setRecipients(recipientsList);

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
      const onlineDrivers = await getOnlineDrivers();
      setDrivers(onlineDrivers);
    } catch (error) {
      console.error("Erro ao buscar motoristas:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: 'Não foi possível carregar os motoristas.'
      });
    }
  }, [toast]);

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleFormSubmit = async () => {
    setIsFormOpen(false);
    if (user) {
      // Usar refreshWithDelay para garantir que os dados sejam atualizados
      refreshWithDelay(() => fetchData(user.uid));
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
        refreshWithDelay(() => fetchData(user.uid));
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <Package className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Minhas Entregas</h1>
            <p className="text-gray-600">
              Acompanhe o status e histórico das suas entregas, {userData.displayName?.split(' ')[0]}.
            </p>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Button 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            onClick={handleOpenForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Entrega
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-blue-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Total de Entregas</span>
                </CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-gray-900">{totalDeliveries}</div>
                <p className="text-xs text-gray-500 mt-1">Todas as entregas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-orange-500">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-orange-800 flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Pendentes</span>
                </CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-orange-600">{pendingDeliveries.length}</div>
                <p className="text-xs text-gray-500 mt-1">Aguardando confirmação</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-green-500">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Concluídas</span>
                </CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-green-600">{deliveryHistory.length}</div>
                <p className="text-xs text-gray-500 mt-1">Entregas realizadas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-purple-500">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-purple-800 flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Investido</span>
                </CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-purple-600">R$ {totalSpent.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">Em entregas concluídas</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-0 rounded-2xl shadow-lg p-1">
            <TabsTrigger 
              value="pending" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Pendentes</span>
              <span className="sm:hidden">Pendentes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Concluídas</span>
              <span className="sm:hidden">Concluídas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payment"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Pagamentos</span>
              <span className="sm:hidden">Pagamentos</span>
            </TabsTrigger>
          </TabsList>

          {/* Entregas Pendentes */}
          <TabsContent value="pending" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    Entregas Pendentes
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Entregas aguardando confirmação ou em andamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {pendingDeliveries.length > 0 ? (
                    <div className="space-y-4">
                      {pendingDeliveries.map((delivery) => (
                        <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{delivery.description}</p>
                            <p className="text-sm text-gray-600">
                              {format(delivery.date instanceof Date ? delivery.date : delivery.date.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary"
                              className="bg-orange-100 text-orange-800 border-0 rounded-full shadow-sm"
                            >
                              {delivery.deliveryStatus}
                            </Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhuma entrega pendente</p>
                      <p className="text-sm">Suas entregas pendentes aparecerão aqui</p>
                      <div className="mt-4 p-3 bg-orange-50 rounded-lg text-left">
                        <p className="text-sm text-orange-800 font-medium">💡 Para criar sua primeira entrega:</p>
                        <p className="text-xs text-orange-600 mt-1">
                          1. Clique no botão &quot;Nova Entrega&quot; no topo da página<br/>
                          2. Preencha os dados completos da entrega<br/>
                          3. Selecione um motorista disponível<br/>
                          4. Aguarde a confirmação do motorista
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Entregas Concluídas */}
          <TabsContent value="completed" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    Entregas Concluídas
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Entregas finalizadas com sucesso
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {deliveryHistory.length > 0 ? (
                    <div className="space-y-4">
                      {deliveryHistory.map((delivery) => (
                        <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{delivery.description}</p>
                            <p className="text-sm text-gray-600">
                              {format(delivery.date instanceof Date ? delivery.date : delivery.date.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="default"
                              className="bg-green-100 text-green-800 border-0 rounded-full shadow-sm"
                            >
                              {delivery.deliveryStatus}
                            </Badge>
                            <span className="text-sm font-semibold text-green-600">
                              R$ {delivery.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhuma entrega concluída</p>
                      <p className="text-sm">Suas entregas concluídas aparecerão aqui</p>
                      <div className="mt-4 p-3 bg-green-50 rounded-lg text-left">
                        <p className="text-sm text-green-800 font-medium">✅ Sobre entregas concluídas:</p>
                        <p className="text-xs text-green-600 mt-1">
                          • Entregas finalizadas pelos motoristas aparecem aqui<br/>
                          • Você pode acompanhar o histórico completo<br/>
                          • Valores e datas ficam registrados permanentemente<br/>
                          • Use para controle financeiro e relatórios
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Pagamentos */}
          <TabsContent value="payment" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    Pagamentos Pendentes
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Entregas aguardando pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {deliveriesToReceive.length > 0 ? (
                    <div className="space-y-4">
                      {deliveriesToReceive.map((delivery) => (
                        <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{delivery.description}</p>
                            <p className="text-sm text-gray-600">
                              {format(delivery.date instanceof Date ? delivery.date : delivery.date.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800 border-0 rounded-full shadow-sm"
                            >
                              {delivery.paymentStatus}
                            </Badge>
                            <span className="text-sm font-semibold text-yellow-600">
                              R$ {delivery.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhum pagamento pendente</p>
                      <p className="text-sm">Seus pagamentos pendentes aparecerão aqui</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Modal Nova Entrega */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DeliveryForm 
              onFormSubmit={handleFormSubmit}
              onCancel={handleCloseForm}
              drivers={drivers}
              recipients={recipients}
            />
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