'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
// Tabs removidos - usando implementação custom para mobile
import { auth } from '@/lib/firebase';
import { getCurrentMonthDeliveriesByClient, getAllDeliveriesByClient, deleteTransaction, type Transaction } from '@/services/transactions';
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
  Trash2,
  Zap,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { OptimizedMotion, OptimizedSkeleton, useOptimizedAnimation } from '@/components/ui/optimized-motion';

interface ClienteDashboardProps {
  canInstall?: boolean;
  install?: () => void;
}

function ClienteDashboardSkeleton() {
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
              <span>Entregas Recentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <OptimizedMotion
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + 0.1 * i }}
                  disableOnMobile={true}
                >
                  <OptimizedSkeleton className="h-10 w-full" />
                </OptimizedMotion>
              ))}
            </div>
          </CardContent>
        </Card>
      </OptimizedMotion>
    </div>
  );
}

function ClienteDashboard({ canInstall = false, install = () => {} }: ClienteDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const { animationProps } = useOptimizedAnimation();
  
  // PWA hook
  const { canInstall: pwaCanInstall, installApp: pwaInstall } = usePWAInstall();
  
  // Auto refresh hook
  const { refreshData, refreshWithDelay } = useAutoRefresh();

  const fetchUserData = useCallback(async (uid: string) => {
    const data = await getUserDocument(uid);
    if (data) setUserData(data);
  }, []);

  const fetchTransactions = useCallback(async (uid: string) => {
    console.log('🔄 ClienteDashboard: fetchTransactions iniciado para uid:', uid);
    // Usar getAllDeliveriesByClient para incluir entregas pendentes de meses anteriores
    const userTransactions = await getAllDeliveriesByClient(uid);
    console.log('📊 ClienteDashboard: Transações carregadas:', userTransactions.length);
    setTransactions(userTransactions);
    console.log('✅ ClienteDashboard: fetchTransactions concluído');
  }, []);

  const refreshAllData = useCallback(async (uid: string) => {
    await Promise.all([
      fetchUserData(uid),
      fetchTransactions(uid)
    ]);
  }, [fetchUserData, fetchTransactions]);

  const handleDeleteDelivery = async (deliveryId: string) => {
    try {
      await deleteTransaction(deliveryId);
      toast({
        title: "Sucesso",
        description: "Entrega excluída com sucesso.",
      });
      if (user) {
        await fetchTransactions(user.uid);
      }
    } catch (error) {
      console.error("Erro ao excluir entrega:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a entrega.",
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setLoading(true);
        try {
          await refreshAllData(user.uid);
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível carregar os dados.",
          });
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, refreshAllData, toast]);

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
      <OptimizedMotion
        {...animationProps}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
      >
        <div className="flex items-center space-x-4">
          <OptimizedMotion
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            disableOnMobile={true}
            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <Package className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </OptimizedMotion>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Co-Piloto Client</h1>
            <p className="text-gray-600">Acompanhe suas entregas e agendamentos, {userData.displayName?.split(' ')[0]}.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {userData && (
              <OptimizedMotion
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                disableOnMobile={true}
              >
                <Badge variant="outline" className="text-sm font-medium capitalize border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-300">
                  <Zap className="h-3 w-3 mr-1" />
                  Perfil: {userData.userType}
                </Badge>
              </OptimizedMotion>
            )}
            <PWAInstallButton canInstall={pwaCanInstall} install={pwaInstall} />
          </div>
        </div>
      </OptimizedMotion>

      <OptimizedMotion
        {...animationProps}
        transition={{ ...animationProps.transition, delay: 0.1 }}
      >
        <div className="grid gap-4 mobile-grid md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = [
              { border: 'border-l-orange-500', bg: 'from-orange-600/5 to-amber-600/5', text: 'text-orange-800', iconBg: 'from-orange-500 to-amber-500' },
              { border: 'border-l-green-500', bg: 'from-green-600/5 to-emerald-600/5', text: 'text-green-800', iconBg: 'from-green-500 to-emerald-500' },
              { border: 'border-l-blue-500', bg: 'from-blue-600/5 to-indigo-600/5', text: 'text-blue-800', iconBg: 'from-blue-500 to-indigo-500' }
            ];
            const colorScheme = colors[index % colors.length];
            
            return (
              <OptimizedMotion
                key={index}
                {...animationProps}
                transition={{ ...animationProps.transition, delay: 0.2 + 0.1 * index }}
                whileHover={{ y: -2, scale: 1.01 }}
                disableOnMobile={true}
                className="group mobile-card"
              >
                <Card className={`shadow-lg bg-white/90 backdrop-blur-sm border-0 rounded-xl overflow-hidden group-hover:shadow-xl transition-all duration-300 border-l-4 ${colorScheme.border} mobile-optimized`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${colorScheme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 mobile-card-content">
                    <CardTitle className={`text-sm font-medium ${colorScheme.text} flex items-center space-x-2`}>
                      <Icon className="h-4 w-4" />
                      <span>{stat.title}</span>
                    </CardTitle>
                    <div className={`w-8 h-8 bg-gradient-to-br ${colorScheme.iconBg} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 mobile-card-content">
                    <div className="text-xl md:text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              </OptimizedMotion>
            );
          })}
        </div>
      </OptimizedMotion>

      <OptimizedMotion
        {...animationProps}
        transition={{ ...animationProps.transition, delay: 0.2 }}
      >
        <div className="w-full">
          {/* Mobile Tabs Custom - Corrigido para mobile */}
          <div className="mobile-tabs-container grid w-full grid-cols-3 border-0 rounded-2xl shadow-lg p-1">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('overview');
              }}
              className={`mobile-tab-button rounded-xl px-2 py-1.5 text-sm font-medium transition-all duration-300 ${
                activeTab === 'overview' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              type="button"
            >
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('deliveries');
              }}
              className={`mobile-tab-button rounded-xl px-2 py-1.5 text-sm font-medium transition-all duration-300 ${
                activeTab === 'deliveries' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              type="button"
            >
              <span className="hidden sm:inline">Entregas</span>
              <span className="sm:hidden">Entregas</span>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('agenda');
              }}
              className={`mobile-tab-button rounded-xl px-2 py-1.5 text-sm font-medium transition-all duration-300 ${
                activeTab === 'agenda' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              type="button"
            >
              <span className="hidden sm:inline">Agenda</span>
              <span className="sm:hidden">Agenda</span>
            </button>
          </div>

          {/* Visão Geral */}
          {activeTab === 'overview' && (
            <div className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Entregas Recentes */}
                <OptimizedMotion
                  {...animationProps}
                  transition={{ ...animationProps.transition, delay: 0.3 }}
                >
                  <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        Entregas Recentes
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Acompanhe o status das suas últimas entregas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      {recentDeliveries.length > 0 ? (
                        <div className="space-y-3">
                          {recentDeliveries.map((delivery) => (
                            <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-900">{delivery.description}</p>
                                <p className="text-xs text-gray-600">
                                  {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={delivery.deliveryStatus === 'Entregue' ? 'default' : 'secondary'}
                                  className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 text-green-600 border-0 rounded-full shadow-sm"
                                >
                                  {delivery.deliveryStatus}
                                </Badge>
                                {delivery.deliveryStatus === 'Pendente' && (
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
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                            <p className="text-sm text-blue-800 font-medium">💡 Como criar uma entrega:</p>
                            <p className="text-xs text-blue-600 mt-1">
                              1. Vá para a aba &quot;Entregas&quot; → Clique em &quot;Nova Entrega&quot;<br/>
                              2. Preencha os dados do remetente e destinatário<br/>
                              3. Escolha um motorista disponível<br/>
                              4. Confirme os detalhes da entrega
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </OptimizedMotion>
              </div>
            </div>
            </div>
          )}

          {/* Entregas */}
          {activeTab === 'deliveries' && (
            <div className="mt-6">
            <div className="space-y-6">
              <div className="grid gap-6">
                {/* Lista Completa de Entregas */}
                <OptimizedMotion
                  {...animationProps}
                  transition={{ ...animationProps.transition, delay: 0.1 }}
                >
                  <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        Todas as Entregas
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Lista completa das suas entregas organizadas por status
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      {deliveryTransactions.length > 0 ? (
                        <div className="space-y-6">
                          {/* Entregas Pendentes */}
                          {pendingDeliveries.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                <ClockIcon className="h-5 w-5" />
                                Pendentes ({pendingDeliveries.length})
                              </h3>
                              <div className="space-y-3">
                                {pendingDeliveries.map((delivery) => (
                                  <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                                    <div className="space-y-1 flex-1">
                                      <p className="font-medium text-gray-900">{delivery.description}</p>
                                      <p className="text-sm text-gray-600">
                                        {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy', { locale: ptBR })}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>💰 R$ {delivery.amount?.toFixed(2)}</span>
                                        <span>📦 {delivery.paymentType}</span>
                                      </div>
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
                            </div>
                          )}

                          {/* Entregas Concluídas */}
                          {completedDeliveries.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Concluídas ({completedDeliveries.length})
                              </h3>
                              <div className="space-y-3">
                                {completedDeliveries.map((delivery) => (
                                  <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                                    <div className="space-y-1 flex-1">
                                      <p className="font-medium text-gray-900">{delivery.description}</p>
                                      <p className="text-sm text-gray-600">
                                        {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy', { locale: ptBR })}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>💰 R$ {delivery.amount?.toFixed(2)}</span>
                                        <span>📦 {delivery.paymentType}</span>
                                        <span>💳 {delivery.paymentStatus}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="default"
                                        className="bg-green-100 text-green-800 border-0 rounded-full shadow-sm"
                                      >
                                        {delivery.deliveryStatus}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Nenhuma entrega encontrada</p>
                          <p className="text-sm">Suas entregas aparecerão aqui quando forem criadas</p>
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                            <p className="text-sm text-blue-800 font-medium">💡 Como criar uma entrega:</p>
                            <p className="text-xs text-blue-600 mt-1">
                              1. Use o menu lateral para ir em &quot;Entregas&quot;<br/>
                              2. Clique em &quot;Nova Entrega&quot; e preencha os dados<br/>
                              3. Selecione um motorista disponível<br/>
                              4. Acompanhe o progresso aqui na Visão Geral
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </OptimizedMotion>
              </div>
            </div>
            </div>
          )}

          {/* Agenda */}
          {activeTab === 'agenda' && (
            <div className="mt-6">
            <OptimizedMotion
              {...animationProps}
              transition={{ ...animationProps.transition, delay: 0.3 }}
            >
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    Agenda e Compromissos
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Gerencie seus agendamentos e compromissos
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Funcionalidade em Desenvolvimento</p>
                    <p className="text-sm">Em breve você poderá gerenciar sua agenda aqui</p>
                    <Button 
                      className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                      onClick={() => router.push('/dashboard/agenda')}
                    >
                      Ir para Agenda Completa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </OptimizedMotion>
            </div>
          )}
        </div>
      </OptimizedMotion>
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