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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
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
import { auth } from '@/lib/firebase';
import { getUserDocument, type UserData } from '@/services/firestore';
import { 
  getAdminStats, 
  getAllUsersWithStats, 
  getDeliveryStats, 
  getFinancialStats,
  getAllDeliveries,
  getPendingDeliveries,
  getInProgressDeliveries,
  getCompletedDeliveries,
  updateDeliveryStatus,
  deleteDelivery,
  type AdminStats,
  type UserWithStats,
  type DeliveryStats,
  type FinancialStats
} from '@/services/admin';
import { 
  Users, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Package,
  Calendar,
  BarChart3,
  Activity,
  Eye,
  Edit,
  Trash2,
  X,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { AdminGuard } from '@/components/AdminGuard';
import { Timestamp } from 'firebase/firestore';

interface AdminDashboardProps {
  canInstall?: boolean;
  install?: () => void;
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg animate-pulse"></div>
              </div>
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent className="relative z-10">
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg animate-pulse"></div>
                <Skeleton className="h-8 w-48" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between p-4 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
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
        ))}
      </div>
    </div>
  );
}

function AdminDashboard({ canInstall = false, install = () => {} }: AdminDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [showInProgressModal, setShowInProgressModal] = useState(false);
  const [inProgressDeliveries, setInProgressDeliveries] = useState<any[]>([]);
  const [loadingInProgress, setLoadingInProgress] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingDelivery, setDeletingDelivery] = useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  // PWA hook
  const { canInstall: pwaCanInstall, installApp: pwaInstall } = usePWAInstall();
  
  // Auto refresh hook
  const { refreshData, refreshWithDelay } = useAutoRefresh();

  const fetchUserData = useCallback(async (uid: string) => {
    const data = await getUserDocument(uid);
    if (data) setUserData(data);
  }, []);

  const fetchPendingDeliveries = useCallback(async () => {
    setLoadingPending(true);
    try {
      const pendingData = await getPendingDeliveries();
      setPendingDeliveries(pendingData);
    } catch (error) {
      console.error('Erro ao carregar entregas pendentes:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar entregas pendentes',
        description: 'Não foi possível carregar as entregas pendentes.',
      });
    } finally {
      setLoadingPending(false);
    }
  }, [toast]);

  const fetchInProgressDeliveries = useCallback(async () => {
    setLoadingInProgress(true);
    try {
      const inProgressData = await getInProgressDeliveries();
      setInProgressDeliveries(inProgressData);
    } catch (error) {
      console.error('Erro ao carregar entregas em andamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar entregas em andamento',
        description: 'Não foi possível carregar as entregas em andamento.',
      });
    } finally {
      setLoadingInProgress(false);
    }
  }, [toast]);

  const fetchCompletedDeliveries = useCallback(async () => {
    setLoadingCompleted(true);
    try {
      const completedData = await getCompletedDeliveries();
      setCompletedDeliveries(completedData);
    } catch (error) {
      console.error('Erro ao carregar entregas concluídas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar entregas concluídas',
        description: 'Não foi possível carregar as entregas concluídas.',
      });
    } finally {
      setLoadingCompleted(false);
    }
  }, [toast]);

  const handleEditDelivery = (delivery: any) => {
    setEditingDelivery(delivery);
    setShowEditModal(true);
  };

  const handleUpdateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    setIsProcessing(true);
    try {
      await updateDeliveryStatus(deliveryId, newStatus);
      
      toast({
        title: 'Status atualizado',
        description: `Status da entrega atualizado para: ${newStatus}`,
      });

      // Recarregar entregas pendentes
      await fetchPendingDeliveries();
      
      // Recarregar estatísticas
      const [statsData, deliveryStatsData] = await Promise.all([
        getAdminStats(),
        getDeliveryStats()
      ]);
      setStats(statsData);
      setDeliveryStats(deliveryStatsData);

      setShowEditModal(false);
      setEditingDelivery(null);
    } catch (error) {
      console.error('Erro ao atualizar status da entrega:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar entrega',
        description: 'Não foi possível atualizar o status da entrega.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDelivery = (delivery: any) => {
    setDeletingDelivery(delivery);
    setShowDeleteDialog(true);
  };

  const confirmDeleteDelivery = async () => {
    if (!deletingDelivery) return;

    setIsProcessing(true);
    try {
      await deleteDelivery(deletingDelivery.id);
      
      toast({
        title: 'Entrega excluída',
        description: 'A entrega foi excluída com sucesso.',
      });

      // Recarregar entregas pendentes
      await fetchPendingDeliveries();
      
      // Recarregar estatísticas
      const [statsData, deliveryStatsData] = await Promise.all([
        getAdminStats(),
        getDeliveryStats()
      ]);
      setStats(statsData);
      setDeliveryStats(deliveryStatsData);

      setShowDeleteDialog(false);
      setDeletingDelivery(null);
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

  // Funções de navegação para os cards
  const handleCardClick = (cardTitle: string) => {
    switch (cardTitle) {
      case "Total de Usuários":
        router.push('/dashboard/admin/users');
        break;
      case "Motoristas Online":
        router.push('/dashboard/admin/online-drivers');
        break;
      case "Entregas Hoje":
        router.push('/dashboard/admin/deliveries');
        break;
      case "Receita Total":
        router.push('/dashboard/admin/financial');
        break;
      default:
        break;
    }
  };

  const fetchAdminData = useCallback(async () => {
    try {
      const [statsData, usersData, deliveryStatsData, financialStatsData, deliveriesData] = await Promise.all([
        getAdminStats(),
        getAllUsersWithStats(),
        getDeliveryStats(),
        getFinancialStats(),
        getAllDeliveries()
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setDeliveryStats(deliveryStatsData);
      setFinancialStats(financialStatsData);
      setDeliveries(deliveriesData);
    } catch (error) {
      console.error("Erro ao carregar dados administrativos:", error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard administrativo.'
      });
    }
  }, [toast]);

  const refreshAllData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      await fetchUserData(uid);
      await fetchAdminData();
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
  }, [fetchUserData, fetchAdminData, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const data = await getUserDocument(currentUser.uid);
        if (data) {
          setUserData(data);
          await refreshAllData(currentUser.uid);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, refreshAllData]);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  if (!user || !userData) {
    return null;
  }

  // Estatísticas principais
  const mainStats = [
    {
      title: "Total de Usuários",
      value: stats?.totalUsers.toString() || "0",
      icon: Users,
      description: `${stats?.totalDrivers || 0} motoristas, ${stats?.totalClients || 0} clientes`,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Motoristas Online",
      value: stats?.onlineDrivers.toString() || "0",
      icon: UserCheck,
      description: "Ativos no momento",
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Entregas Hoje",
      value: stats?.todayDeliveries.toString() || "0",
      icon: Package,
      description: `${stats?.thisMonthDeliveries || 0} este mês`,
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "Receita Total",
      value: `R$ ${stats?.totalRevenue.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      description: `Lucro: R$ ${stats?.netProfit.toFixed(2) || '0.00'}`,
      color: "text-emerald-600 dark:text-emerald-400"
    }
  ];

  // Top 5 usuários mais ativos
  const topUsers = users
    .sort((a, b) => (b.totalDeliveries || 0) - (a.totalDeliveries || 0))
    .slice(0, 5);

  // Entregas recentes
  const recentDeliveries = deliveries.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
          <Shield className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600">
            Bem-vindo, {userData.displayName || user.email}! Gerencie todo o sistema.
          </p>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm font-medium bg-white/80 backdrop-blur-sm border-0 rounded-xl shadow-md">Administrador</Badge>
            <PWAInstallButton canInstall={pwaCanInstall} install={pwaInstall} />
          </div>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer"
              onClick={() => handleCardClick(stat.title)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-900">{stat.title}</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-600">{stat.description}</p>
                <p className="text-xs text-gray-600 mt-1">Clique para ver detalhes</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-sm border-0 rounded-2xl shadow-lg p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium">Visão Geral</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium">Usuários</TabsTrigger>
          <TabsTrigger value="deliveries" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium">Entregas</TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium">Financeiro</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium">Relatórios</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Usuários */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  Usuários Mais Ativos
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Top 5 usuários por número de entregas
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {topUsers.length > 0 ? (
                  <div className="space-y-3">
                    {topUsers.map((user, index) => (
                      <div key={user.uid} className="flex items-center justify-between p-3 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                          <p className="text-xs text-gray-600 capitalize">
                            {user.userType} • {user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 border-0 rounded-full shadow-sm">
                            {user.totalDeliveries || 0} entregas
                          </Badge>
                          <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-gradient-to-r from-green-600/10 to-green-500/10 text-green-600 border-0 rounded-full shadow-sm" : "bg-gradient-to-r from-gray-600/10 to-gray-500/10 text-gray-600 border-0 rounded-full shadow-sm"}>
                            {user.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-900">Nenhum usuário encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Entregas Recentes */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-xl flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  Entregas Recentes
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Últimas entregas do sistema
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
                            {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={delivery.deliveryStatus === 'Entregue' ? 'default' : 'secondary'}
                            className={delivery.deliveryStatus === 'Entregue' ? "bg-gradient-to-r from-green-600/10 to-green-500/10 text-green-600 border-0 rounded-full shadow-sm" : "bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 border-0 rounded-full shadow-sm"}
                          >
                            {delivery.deliveryStatus}
                          </Badge>
                          <span className="text-sm font-semibold text-gray-900">
                            R$ {delivery.amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl flex items-center justify-center">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-900">Nenhuma entrega encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usuários */}
        <TabsContent value="users" className="space-y-6">
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                Gestão de Usuários
              </CardTitle>
              <CardDescription className="text-gray-600">
                Gerencie todos os usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.uid} className="flex items-center justify-between p-4 border rounded-2xl bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 border-0 rounded-full shadow-sm">{user.userType}</Badge>
                          <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-gradient-to-r from-green-600/10 to-green-500/10 text-green-600 border-0 rounded-full shadow-sm" : "bg-gradient-to-r from-gray-600/10 to-gray-500/10 text-gray-600 border-0 rounded-full shadow-sm"}>
                            {user.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          {user.userType === 'motorista' && (
                            <Badge variant={user.isOnline ? "default" : "outline"} className={user.isOnline ? "bg-gradient-to-r from-green-600/10 to-green-500/10 text-green-600 border-0 rounded-full shadow-sm" : "bg-gradient-to-r from-gray-600/10 to-gray-500/10 text-gray-600 border-0 rounded-full shadow-sm"}>
                              {user.isOnline ? "Online" : "Offline"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <p className="text-gray-900">{user.totalDeliveries || 0} entregas</p>
                          <p className="text-gray-600">
                            R$ {(user.totalRevenue || 0).toFixed(2)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">Nenhum usuário encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entregas */}
        <TabsContent value="deliveries" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <div className="text-2xl font-bold text-gray-900">{deliveryStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card 
              className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer"
              onClick={() => {
                setShowPendingModal(true);
                fetchPendingDeliveries();
              }}
            >
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
                <div className="text-2xl font-bold text-orange-600">{deliveryStats?.pending || 0}</div>
                <p className="text-xs text-gray-600 mt-1">Clique para ver detalhes</p>
              </CardContent>
            </Card>
            <Card 
              className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer"
              onClick={() => {
                setShowInProgressModal(true);
                fetchInProgressDeliveries();
              }}
            >
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
                <div className="text-2xl font-bold text-blue-600">{deliveryStats?.inProgress || 0}</div>
                <p className="text-xs text-gray-600 mt-1">Clique para ver detalhes</p>
              </CardContent>
            </Card>
            <Card 
              className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer"
              onClick={() => {
                setShowCompletedModal(true);
                fetchCompletedDeliveries();
              }}
            >
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
                <div className="text-2xl font-bold text-green-600">{deliveryStats?.completed || 0}</div>
                <p className="text-xs text-gray-600 mt-1">Clique para ver detalhes</p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                Todas as Entregas
              </CardTitle>
              <CardDescription className="text-gray-600">
                Lista completa de entregas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {deliveries.length > 0 ? (
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-2xl bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{delivery.description}</p>
                        <p className="text-sm text-gray-600">
                          {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={delivery.deliveryStatus === 'Entregue' ? 'default' : 'secondary'}
                          className={delivery.deliveryStatus === 'Entregue' ? "bg-gradient-to-r from-green-600/10 to-green-500/10 text-green-600 border-0 rounded-full shadow-sm" : "bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 border-0 rounded-full shadow-sm"}
                        >
                          {delivery.deliveryStatus}
                        </Badge>
                        <span className="font-semibold text-gray-900">
                          R$ {delivery.amount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">Nenhuma entrega encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-900">Receita Total</CardTitle>
                <div className="w-6 h-6 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-emerald-600">
                  R$ {financialStats?.totalRevenue.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-900">Despesas Total</CardTitle>
                <div className="w-6 h-6 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-3 w-3 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-rose-600">
                  R$ {financialStats?.totalExpenses.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-900">Lucro Líquido</CardTitle>
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-3 w-3 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className={`text-2xl font-bold ${(financialStats?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {financialStats?.netProfit.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Motoristas */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-xl flex items-center justify-center">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                  Top Motoristas por Receita
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {financialStats?.topRevenueDrivers && financialStats.topRevenueDrivers.length > 0 ? (
                  <div className="space-y-3">
                    {financialStats.topRevenueDrivers.map((driver, index) => (
                      <div key={driver.driverId} className="flex items-center justify-between p-3 border rounded-2xl bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">{driver.driverName}</p>
                          <p className="text-xs text-gray-600">#{index + 1}</p>
                        </div>
                        <span className="font-semibold text-emerald-600">
                          R$ {driver.revenue.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl flex items-center justify-center">
                      <Truck className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-900">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Clientes */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  Top Clientes por Gastos
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {financialStats?.topSpendingClients && financialStats.topSpendingClients.length > 0 ? (
                  <div className="space-y-3">
                    {financialStats.topSpendingClients.map((client, index) => (
                      <div key={client.clientId} className="flex items-center justify-between p-3 border rounded-2xl bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">{client.clientName}</p>
                          <p className="text-xs text-gray-600">#{index + 1}</p>
                        </div>
                        <span className="font-semibold text-blue-600">
                          R$ {client.spending.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-900">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                Relatórios do Sistema
              </CardTitle>
              <CardDescription className="text-gray-600">
                Relatórios detalhados e análises do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <p className="text-lg font-medium text-gray-900">Relatórios em Desenvolvimento</p>
                <p className="text-sm text-gray-600">Em breve você poderá gerar relatórios detalhados aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Entregas Pendentes */}
      <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="pending-deliveries-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Entregas Pendentes
            </DialogTitle>
            <DialogDescription id="pending-deliveries-description">
              Lista de todas as entregas com status &quot;Pendente&quot;
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingPending ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Carregando entregas pendentes...</span>
              </div>
            ) : pendingDeliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">Nenhuma entrega pendente</p>
                <p className="text-sm">Todas as entregas estão em dia!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            {delivery.deliveryStatus}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ID: {delivery.id}
                          </span>
                        </div>
                        <p className="font-medium">{delivery.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {delivery.amount?.toFixed(2) || '0,00'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {delivery.date ? (
                              delivery.date instanceof Date 
                                ? format(delivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                : format(delivery.date.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            ) : 'Data não informada'}
                          </span>
                          {delivery.userId && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {delivery.userId}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDelivery(delivery)}
                          disabled={isProcessing}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDelivery(delivery)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowPendingModal(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Status */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent aria-describedby="edit-status-description">
          <DialogHeader>
            <DialogTitle>Alterar Status da Entrega</DialogTitle>
            <DialogDescription id="edit-status-description">
              Selecione o novo status para a entrega
            </DialogDescription>
          </DialogHeader>
          
          {editingDelivery && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{editingDelivery.description}</p>
                <p className="text-sm text-muted-foreground">
                  ID: {editingDelivery.id} | Status atual: {editingDelivery.deliveryStatus}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Novo Status</label>
                <Select onValueChange={(value) => handleUpdateDeliveryStatus(editingDelivery.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmada">Confirmada</SelectItem>
                    <SelectItem value="A caminho">A caminho</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                    <SelectItem value="Recusada">Recusada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowEditModal(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                Tem certeza de que deseja excluir esta entrega?
                <br />
                <br />
                <strong>Entrega:</strong> {deletingDelivery?.description}
                <br />
                <strong>ID:</strong> {deletingDelivery?.id}
                <br />
                <strong>Valor:</strong> R$ {deletingDelivery?.amount?.toFixed(2) || '0,00'}
                <br />
                <br />
                Esta ação é <strong>irreversível</strong>.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} disabled={isProcessing}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDelivery}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Excluindo...' : 'Sim, excluir entrega'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Entregas em Andamento */}
      <Dialog open={showInProgressModal} onOpenChange={setShowInProgressModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="in-progress-deliveries-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Entregas em Andamento
            </DialogTitle>
            <DialogDescription id="in-progress-deliveries-description">
              Lista de todas as entregas com status &quot;A caminho&quot;
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingInProgress ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Carregando entregas em andamento...</span>
              </div>
            ) : inProgressDeliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                <p className="text-lg font-medium">Nenhuma entrega em andamento</p>
                <p className="text-sm">Não há entregas com status &quot;A caminho&quot; no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inProgressDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            {delivery.deliveryStatus}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ID: {delivery.id}
                          </span>
                        </div>
                        <p className="font-medium">{delivery.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {delivery.amount?.toFixed(2) || '0,00'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {delivery.date ? (
                              delivery.date instanceof Date 
                                ? format(delivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                : format(delivery.date.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            ) : 'Data não informada'}
                          </span>
                          {delivery.userId && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {delivery.userId}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDelivery(delivery)}
                          disabled={isProcessing}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDelivery(delivery)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowInProgressModal(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Entregas Concluídas */}
      <Dialog open={showCompletedModal} onOpenChange={setShowCompletedModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="completed-deliveries-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Entregas Concluídas
            </DialogTitle>
            <DialogDescription id="completed-deliveries-description">
              Lista de todas as entregas com status &quot;Entregue&quot;
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingCompleted ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Carregando entregas concluídas...</span>
              </div>
            ) : completedDeliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">Nenhuma entrega concluída</p>
                <p className="text-sm">Não há entregas com status &quot;Entregue&quot; no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {delivery.deliveryStatus}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ID: {delivery.id}
                          </span>
                        </div>
                        <p className="font-medium">{delivery.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {delivery.amount?.toFixed(2) || '0,00'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {delivery.date ? (
                              delivery.date instanceof Date 
                                ? format(delivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                : format(delivery.date.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            ) : 'Data não informada'}
                          </span>
                          {delivery.userId && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {delivery.userId}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDelivery(delivery)}
                          disabled={isProcessing}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDelivery(delivery)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowCompletedModal(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>
    </AdminGuard>
  );
}
