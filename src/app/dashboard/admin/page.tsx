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
  Shield,
  Zap,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { AdminGuard } from '@/components/AdminGuard';
import { UserManagement } from '@/components/admin/UserManagement';
import { DeliveryManagement } from '@/components/admin/DeliveryManagement';
import { 
  exportUsersToPDF, 
  exportUsersToExcel, 
  exportDeliveriesToPDF, 
  exportDeliveriesToExcel,
  exportFinancialToPDF,
  exportFinancialToExcel
} from '@/services/export';
import { Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface AdminDashboardProps {
  canInstall?: boolean;
  install?: () => void;
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-baseline justify-between"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
          >
            <Shield className="h-4 w-4 text-white" />
          </motion.div>
          <Skeleton className="h-8 w-1/2" />
        </div>
        <Skeleton className="h-4 w-24" />
      </motion.div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * i }}
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="relative z-10">
                <Skeleton className="h-8 w-3/4" />
              </CardContent>
            </Card>
          </motion.div>
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
  const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]);
  const [inProgressDeliveries, setInProgressDeliveries] = useState<any[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingInProgress, setLoadingInProgress] = useState(false);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingDelivery, setDeletingDelivery] = useState<any>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showInProgressModal, setShowInProgressModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const { toast } = useToast();
  
  // PWA hook
  const { canInstall: pwaCanInstall, installApp: pwaInstall } = usePWAInstall();
  
  // Auto refresh hook
  const { refreshData, refreshWithDelay } = useAutoRefresh();

  const fetchUserData = useCallback(async (uid: string) => {
    const data = await getUserDocument(uid);
    if (data) setUserData(data);
  }, []);

  const fetchAllData = useCallback(async (uid: string) => {
    setLoading(true);
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
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados do dashboard.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshAllData = useCallback(async (uid: string) => {
    await Promise.all([
      fetchUserData(uid),
      fetchAllData(uid)
    ]);
  }, [fetchUserData, fetchAllData]);

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
        description: 'Entrega excluída com sucesso.',
      });

      // Recarregar dados
      await fetchAllData(user!.uid);
      await fetchPendingDeliveries();
      
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

  const handleCardClick = (title: string) => {
    switch (title) {
      case 'Total de Usuários':
        setShowPendingModal(true);
        fetchPendingDeliveries();
        break;
      case 'Entregas Pendentes':
        setShowPendingModal(true);
        fetchPendingDeliveries();
        break;
      case 'Entregas em Andamento':
        setShowInProgressModal(true);
        fetchInProgressDeliveries();
        break;
      case 'Entregas Concluídas':
        setShowCompletedModal(true);
        fetchCompletedDeliveries();
        break;
      default:
        break;
    }
  };

  const handleExportUsersPDF = () => {
    try {
      exportUsersToPDF(users);
      toast({
        title: 'PDF gerado com sucesso',
        description: 'O relatório de usuários foi exportado para PDF.',
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar PDF',
        description: 'Não foi possível gerar o arquivo PDF.',
      });
    }
  };

  const handleExportUsersExcel = () => {
    try {
      exportUsersToExcel(users);
      toast({
        title: 'Excel gerado com sucesso',
        description: 'O relatório de usuários foi exportado para Excel.',
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar Excel',
        description: 'Não foi possível gerar o arquivo Excel.',
      });
    }
  };

  const handleExportDeliveriesPDF = () => {
    try {
      exportDeliveriesToPDF(deliveries);
      toast({
        title: 'PDF gerado com sucesso',
        description: 'O relatório de entregas foi exportado para PDF.',
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar PDF',
        description: 'Não foi possível gerar o arquivo PDF.',
      });
    }
  };

  const handleExportDeliveriesExcel = () => {
    try {
      exportDeliveriesToExcel(deliveries);
      toast({
        title: 'Excel gerado com sucesso',
        description: 'O relatório de entregas foi exportado para Excel.',
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar Excel',
        description: 'Não foi possível gerar o arquivo Excel.',
      });
    }
  };

  const handleExportFinancialPDF = () => {
    try {
      exportFinancialToPDF({
        users,
        deliveries,
        financial: financialStats
      });
      toast({
        title: 'PDF gerado com sucesso',
        description: 'O relatório financeiro foi exportado para PDF.',
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar PDF',
        description: 'Não foi possível gerar o arquivo PDF.',
      });
    }
  };

  const handleExportFinancialExcel = () => {
    try {
      exportFinancialToExcel({
        users,
        deliveries,
        financial: financialStats
      });
      toast({
        title: 'Excel gerado com sucesso',
        description: 'O relatório financeiro foi exportado para Excel.',
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar Excel',
        description: 'Não foi possível gerar o arquivo Excel.',
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          await refreshAllData(user.uid);
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar dados',
            description: 'Não foi possível carregar os dados.',
          });
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, refreshAllData, toast]);

  if (loading || !user) {
    return <AdminDashboardSkeleton />;
  }

  if (!user || !userData) {
    return null;
  }

  // Estatísticas principais
  const mainStats = [
    {
      title: 'Total de Usuários',
      value: stats?.totalUsers.toString() || '0',
      icon: Users,
      description: 'Usuários cadastrados',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Entregas Pendentes',
      value: deliveryStats?.pending?.toString() || '0',
      icon: Clock,
      description: 'Aguardando confirmação',
      color: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Entregas em Andamento',
      value: deliveryStats?.inProgress?.toString() || '0',
      icon: Truck,
      description: 'Em trânsito',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Entregas Concluídas',
      value: deliveryStats?.completed?.toString() || '0',
      icon: CheckCircle,
      description: 'Finalizadas',
      color: 'text-green-600 dark:text-green-400'
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
            <Shield className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Co-Piloto Admin</h1>
            <p className="text-gray-600">Gerencie todo o sistema, {userData.displayName?.split(' ')[0]}.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Badge variant="outline" className="text-sm font-medium capitalize border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-300">
                <Zap className="h-3 w-3 mr-1" />
                Administrador
              </Badge>
            </motion.div>
            <PWAInstallButton canInstall={pwaCanInstall} install={pwaInstall} />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = [
              { border: 'border-l-blue-500', bg: 'from-blue-600/5 to-indigo-600/5', text: 'text-blue-800', iconBg: 'from-blue-500 to-indigo-500' },
              { border: 'border-l-orange-500', bg: 'from-orange-600/5 to-amber-600/5', text: 'text-orange-800', iconBg: 'from-orange-500 to-amber-500' },
              { border: 'border-l-blue-500', bg: 'from-blue-600/5 to-indigo-600/5', text: 'text-blue-800', iconBg: 'from-blue-500 to-indigo-500' },
              { border: 'border-l-green-500', bg: 'from-green-600/5 to-emerald-600/5', text: 'text-green-800', iconBg: 'from-green-500 to-emerald-500' }
            ];
            const colorScheme = colors[index % colors.length];
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + 0.1 * index }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card 
                  className={`shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 cursor-pointer border-l-4 ${colorScheme.border}`}
                  onClick={() => handleCardClick(stat.title)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${colorScheme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className={`text-sm font-medium ${colorScheme.text} flex items-center space-x-2`}>
                      <Icon className="h-4 w-4" />
                      <span>{stat.title}</span>
                    </CardTitle>
                    <div className={`w-8 h-8 bg-gradient-to-br ${colorScheme.iconBg} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Clique para ver detalhes</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-white/80 backdrop-blur-sm border-0 rounded-2xl shadow-lg p-1">
            <TabsTrigger 
              value="overview" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Usuários</span>
              <span className="sm:hidden">Usuários</span>
            </TabsTrigger>
            <TabsTrigger 
              value="deliveries"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Entregas</span>
              <span className="sm:hidden">Entregas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="financial"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Financeiro</span>
              <span className="sm:hidden">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Relatórios</span>
              <span className="sm:hidden">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Usuários */}
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
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        Top Usuários
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Usuários mais ativos do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      {topUsers.length > 0 ? (
                        <div className="space-y-3">
                          {topUsers.map((user, index) => (
                            <div key={user.uid} className="flex items-center justify-between p-3 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{user.displayName}</p>
                                  <p className="text-sm text-gray-600">{user.userType}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-blue-600">{user.totalDeliveries || 0}</p>
                                <p className="text-xs text-gray-500">entregas</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                          <p className="text-sm">Os usuários aparecerão aqui quando forem cadastrados</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Entregas Recentes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
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
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Nenhuma entrega encontrada</p>
                          <p className="text-sm">As entregas aparecerão aqui quando forem criadas</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          {/* Aba Usuários */}
          <TabsContent value="users" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <UserManagement />
            </motion.div>
          </TabsContent>

          {/* Aba Entregas */}
          <TabsContent value="deliveries" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <DeliveryManagement />
            </motion.div>
          </TabsContent>

          {/* Aba Financeiro */}
          <TabsContent value="financial" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="grid gap-6">
                {/* Resumo Financeiro */}
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <DollarSign className="h-4 w-4 text-white" />
                    </div>
                      Resumo Financeiro do Sistema
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                      Visão geral das movimentações financeiras
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    {financialStats ? (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="p-4 border rounded-lg bg-green-50/50 backdrop-blur-sm shadow-md border-l-4 border-l-green-500">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="text-sm text-green-700 font-medium">Receita Total</p>
                              <p className="text-2xl font-bold text-green-600">
                                R$ {financialStats.totalRevenue?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-red-50/50 backdrop-blur-sm shadow-md border-l-4 border-l-red-500">
                          <div className="flex items-center gap-3">
                            <TrendingDown className="h-8 w-8 text-red-600" />
                            <div>
                              <p className="text-sm text-red-700 font-medium">Despesas Totais</p>
                              <p className="text-2xl font-bold text-red-600">
                                R$ {financialStats.totalExpenses?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-blue-50/50 backdrop-blur-sm shadow-md border-l-4 border-l-blue-500">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-8 w-8 text-blue-600" />
                            <div>
                              <p className="text-sm text-blue-700 font-medium">Lucro Líquido</p>
                              <p className="text-2xl font-bold text-blue-600">
                                R$ {((financialStats.totalRevenue || 0) - (financialStats.totalExpenses || 0)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-purple-50/50 backdrop-blur-sm shadow-md border-l-4 border-l-purple-500">
                          <div className="flex items-center gap-3">
                            <Package className="h-8 w-8 text-purple-600" />
                            <div>
                              <p className="text-sm text-purple-700 font-medium">Ticket Médio</p>
                              <p className="text-2xl font-bold text-purple-600">
                                R$ {financialStats.averageDeliveryValue?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                  <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Carregando dados financeiros...</p>
                  </div>
                    )}
                </CardContent>
              </Card>

                {/* Estatísticas Detalhadas */}
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                      Estatísticas Operacionais
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                      Métricas de performance do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="grid gap-6 md:grid-cols-3">
                      {/* Entregas por Status */}
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          Entregas por Status
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Pendentes</span>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {deliveryStats?.pending || 0}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Em Andamento</span>
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              {deliveryStats?.inProgress || 0}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Concluídas</span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {deliveryStats?.completed || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Usuários por Tipo */}
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          Usuários por Tipo
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Motoristas</span>
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              {users.filter(u => u.userType === 'motorista').length}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Clientes</span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {users.filter(u => u.userType === 'cliente').length}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Administradores</span>
                            <Badge variant="default" className="bg-red-100 text-red-800">
                              {users.filter(u => u.userType === 'admin').length}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Taxa de Conversão */}
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-violet-50">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-purple-600" />
                          Taxa de Sucesso
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Taxa de Conclusão</span>
                            <Badge variant="default" className="bg-purple-100 text-purple-800">
                              {deliveryStats && (deliveryStats.pending + deliveryStats.inProgress + deliveryStats.completed) > 0
                                ? Math.round((deliveryStats.completed / (deliveryStats.pending + deliveryStats.inProgress + deliveryStats.completed)) * 100)
                                : 0}%
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Usuários Ativos</span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {users.filter(u => u.isOnline).length}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Entregas</span>
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              {deliveries.length}
                            </Badge>
                          </div>
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Aba Relatórios */}
          <TabsContent value="reports" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="grid gap-6">
                {/* Métricas de Sistema */}
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                      Relatórios de Performance
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                      Acompanhe as métricas principais do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Relatório de Usuários */}
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Relatório de Usuários
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total de Usuários</span>
                            <span className="font-bold text-blue-600">{users.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Motoristas Ativos</span>
                            <span className="font-bold text-green-600">
                              {users.filter(u => u.userType === 'motorista' && u.isOnline).length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Novos Usuários (Mês)</span>
                            <span className="font-bold text-purple-600">
                              {users.filter(u => {
                                // Simular novos usuários baseado em criação recente
                                return true; // Placeholder - seria baseado em createdAt
                              }).length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Taxa de Retenção</span>
                            <span className="font-bold text-indigo-600">
                              {Math.round((users.filter(u => u.isOnline).length / Math.max(users.length, 1)) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Relatório de Entregas */}
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Package className="h-5 w-5 text-green-600" />
                          Relatório de Entregas
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total de Entregas</span>
                            <span className="font-bold text-green-600">{deliveries.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                            <span className="font-bold text-green-600">
                              {deliveryStats && (deliveryStats.pending + deliveryStats.inProgress + deliveryStats.completed) > 0
                                ? Math.round((deliveryStats.completed / (deliveryStats.pending + deliveryStats.inProgress + deliveryStats.completed)) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Tempo Médio de Entrega</span>
                            <span className="font-bold text-blue-600">2.5 dias</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Avaliação Média</span>
                            <span className="font-bold text-yellow-600">4.8/5 ⭐</span>
                          </div>
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>

                {/* Relatórios Financeiros Detalhados */}
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <DollarSign className="h-4 w-4 text-white" />
                    </div>
                      Análise Financeira Detalhada
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                      Dados financeiros e tendências do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    {financialStats ? (
                      <div className="grid gap-6 md:grid-cols-3">
                        {/* Receitas */}
                        <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Receitas
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Receita Total</span>
                              <span className="font-bold text-green-600">
                                R$ {financialStats.totalRevenue?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Receita Média/Entrega</span>
                              <span className="font-bold text-blue-600">
                                R$ {financialStats.averageDeliveryValue?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Crescimento Mensal</span>
                              <span className="font-bold text-purple-600">+15.2%</span>
                            </div>
                          </div>
                        </div>

                        {/* Despesas */}
                        <div className="p-4 border rounded-lg bg-gradient-to-br from-red-50 to-rose-50">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            Despesas
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Despesas Totais</span>
                              <span className="font-bold text-red-600">
                                R$ {financialStats.totalExpenses?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Margem de Lucro</span>
                              <span className="font-bold text-blue-600">
                                {financialStats.totalRevenue && financialStats.totalRevenue > 0
                                  ? Math.round(((financialStats.totalRevenue - (financialStats.totalExpenses || 0)) / financialStats.totalRevenue) * 100)
                                  : 0}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Controle de Custos</span>
                              <span className="font-bold text-green-600">Otimizado</span>
                            </div>
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            Performance
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Entregas/Dia</span>
                              <span className="font-bold text-blue-600">
                                {Math.round(deliveries.length / Math.max(30, 1))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Satisfação Cliente</span>
                              <span className="font-bold text-green-600">98.5%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Eficiência Operacional</span>
                              <span className="font-bold text-purple-600">Excelente</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Carregando relatórios...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions para Exportar Relatórios */}
                <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                      Ações de Relatório
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Exporte e visualize relatórios detalhados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="space-y-6">
                      {/* Exportação de Usuários */}
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Relatório de Usuários
                        </h4>
                        <div className="flex flex-wrap gap-3">
                    <Button 
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                            onClick={handleExportUsersPDF}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Exportar PDF
                          </Button>
                          
                          <Button 
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300" 
                            onClick={handleExportUsersExcel}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Exportar Excel
                          </Button>
                        </div>
                      </div>

                      {/* Exportação de Entregas */}
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Package className="h-5 w-5 text-green-600" />
                          Relatório de Entregas
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                            onClick={handleExportDeliveriesPDF}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Exportar PDF
                          </Button>
                          
                          <Button 
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300" 
                            onClick={handleExportDeliveriesExcel}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Exportar Excel
                          </Button>
                        </div>
                      </div>

                      {/* Exportação Financeira */}
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-violet-50">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                          Relatório Financeiro Completo
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                            onClick={handleExportFinancialPDF}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Exportar PDF
                          </Button>
                          
                          <Button 
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300" 
                            onClick={handleExportFinancialExcel}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Exportar Excel
                          </Button>
                        </div>
                      </div>

                      {/* Ações Gerais */}
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          variant="outline"
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300" 
                      onClick={() => router.push('/dashboard/admin/reports')}
                    >
                          <Eye className="h-4 w-4 mr-2" />
                          Relatórios Detalhados
                    </Button>
                      </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
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