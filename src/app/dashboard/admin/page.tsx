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
import { auth } from '@/lib/firebase';
import { getUserDocument, type UserData } from '@/services/firestore';
import { 
  getAdminStats, 
  getAllUsersWithStats, 
  getDeliveryStats, 
  getFinancialStats,
  getAllDeliveries,
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
  Trash2
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between p-4 border rounded-lg">
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
  const { toast } = useToast();
  
  // PWA hook
  const { canInstall: pwaCanInstall, installApp: pwaInstall } = usePWAInstall();
  
  // Auto refresh hook
  const { refreshData, refreshWithDelay } = useAutoRefresh();

  const fetchUserData = useCallback(async (uid: string) => {
    const data = await getUserDocument(uid);
    if (data) setUserData(data);
  }, []);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {userData.displayName || user.email}! Gerencie todo o sistema.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm font-medium">Administrador</Badge>
            <PWAInstallButton canInstall={pwaCanInstall} install={pwaInstall} />
          </div>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Usuários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários Mais Ativos
                </CardTitle>
                <CardDescription>
                  Top 5 usuários por número de entregas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topUsers.length > 0 ? (
                  <div className="space-y-3">
                    {topUsers.map((user, index) => (
                      <div key={user.uid} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {user.userType} • {user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {user.totalDeliveries || 0} entregas
                          </Badge>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum usuário encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Entregas Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Entregas Recentes
                </CardTitle>
                <CardDescription>
                  Últimas entregas do sistema
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
                            {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={delivery.deliveryStatus === 'Entregue' ? 'default' : 'secondary'}
                          >
                            {delivery.deliveryStatus}
                          </Badge>
                          <span className="text-sm font-semibold">
                            R$ {delivery.amount?.toFixed(2) || '0.00'}
                          </span>
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
          </div>
        </TabsContent>

        {/* Usuários */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestão de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie todos os usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.uid} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{user.userType}</Badge>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          {user.userType === 'motorista' && (
                            <Badge variant={user.isOnline ? "default" : "outline"}>
                              {user.isOnline ? "Online" : "Offline"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <p>{user.totalDeliveries || 0} entregas</p>
                          <p className="text-muted-foreground">
                            R$ {(user.totalRevenue || 0).toFixed(2)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entregas */}
        <TabsContent value="deliveries" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveryStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{deliveryStats?.pending || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Em Andamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{deliveryStats?.inProgress || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{deliveryStats?.completed || 0}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Todas as Entregas
              </CardTitle>
              <CardDescription>
                Lista completa de entregas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveries.length > 0 ? (
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">{delivery.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(delivery.date instanceof Timestamp ? delivery.date.toDate() : delivery.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={delivery.deliveryStatus === 'Entregue' ? 'default' : 'secondary'}
                        >
                          {delivery.deliveryStatus}
                        </Badge>
                        <span className="font-semibold">
                          R$ {delivery.amount?.toFixed(2) || '0.00'}
                        </span>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma entrega encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  R$ {financialStats?.totalRevenue.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas Total</CardTitle>
                <TrendingDown className="h-4 w-4 text-rose-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">
                  R$ {financialStats?.totalExpenses.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(financialStats?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {financialStats?.netProfit.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Motoristas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Top Motoristas por Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financialStats?.topRevenueDrivers && financialStats.topRevenueDrivers.length > 0 ? (
                  <div className="space-y-3">
                    {financialStats.topRevenueDrivers.map((driver, index) => (
                      <div key={driver.driverId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{driver.driverName}</p>
                          <p className="text-xs text-muted-foreground">#{index + 1}</p>
                        </div>
                        <span className="font-semibold text-emerald-600">
                          R$ {driver.revenue.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Clientes por Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financialStats?.topSpendingClients && financialStats.topSpendingClients.length > 0 ? (
                  <div className="space-y-3">
                    {financialStats.topSpendingClients.map((client, index) => (
                      <div key={client.clientId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{client.clientName}</p>
                          <p className="text-xs text-muted-foreground">#{index + 1}</p>
                        </div>
                        <span className="font-semibold text-blue-600">
                          R$ {client.spending.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Relatórios do Sistema
              </CardTitle>
              <CardDescription>
                Relatórios detalhados e análises do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Relatórios em Desenvolvimento</p>
                <p className="text-sm">Em breve você poderá gerar relatórios detalhados aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
