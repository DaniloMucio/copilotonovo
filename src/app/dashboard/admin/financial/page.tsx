'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  PieChart, 
  BarChart3,
  Download,
  Calendar,
  Filter,
  ArrowLeft,
  RefreshCw,
  Users,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Target
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { getUserDocument, type UserData } from '@/services/firestore';
import { 
  getFinancialStats, 
  getDeliveryStats,
  getAllDeliveries,
  getAllUsersWithStats,
  type FinancialStats,
  type DeliveryStats,
  type UserWithStats
} from '@/services/admin';

function FinancialContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [allDeliveries, setAllDeliveries] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithStats[]>([]);
  const [period, setPeriod] = useState<string>('30');

  // Verificar autenticação e permissões
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getUserDocument(currentUser.uid);
        if (!userDoc) {
          console.log('Dados do usuário não encontrados no Firestore');
          await auth.signOut();
          router.push('/login');
          return;
        }

        if (userDoc.userType !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setUser(currentUser);
        setUserData(userDoc);
      } catch (error) {
        console.error('Erro ao verificar dados do usuário:', error);
        await auth.signOut();
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Carregar dados financeiros
  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [financial, delivery, deliveries, users] = await Promise.all([
        getFinancialStats(),
        getDeliveryStats(),
        getAllDeliveries(),
        getAllUsersWithStats()
      ]);

      setFinancialStats(financial);
      setDeliveryStats(delivery);
      setAllDeliveries(deliveries);
      setAllUsers(users);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os dados financeiros.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (userData?.userType === 'admin') {
      loadFinancialData();
    }
  }, [userData, loadFinancialData]);

  // Calcular métricas adicionais
  const calculateMetrics = () => {
    if (!financialStats || !deliveryStats || !allUsers.length) {
      return {
        averageOrderValue: 0,
        revenuePerDriver: 0,
        completionRate: 0,
        activeDrivers: 0,
        totalClients: 0
      };
    }

    const activeDrivers = allUsers.filter(user => user.userType === 'motorista' && user.isOnline).length;
    const totalClients = allUsers.filter(user => user.userType === 'cliente').length;
    const averageOrderValue = deliveryStats.totalDeliveries > 0 ? financialStats.totalRevenue / deliveryStats.totalDeliveries : 0;
    const revenuePerDriver = activeDrivers > 0 ? financialStats.totalRevenue / activeDrivers : 0;
    const completionRate = deliveryStats.totalDeliveries > 0 ? (deliveryStats.completedDeliveries / deliveryStats.totalDeliveries) * 100 : 0;

    return {
      averageOrderValue,
      revenuePerDriver,
      completionRate,
      activeDrivers,
      totalClients
    };
  };

  const metrics = calculateMetrics();

  // Função para exportar relatório em PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
      
      // Cabeçalho
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Financeiro', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${currentDate}`, 20, 30);
      doc.text(`Período: Últimos ${period} dias`, 20, 37);
      
      // Dados principais
      let yPosition = 50;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Financeiro', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const summaryData = [
        ['Receita Total', `R$ ${financialStats?.totalRevenue.toFixed(2) || '0.00'}`],
        ['Lucro Líquido', `R$ ${financialStats?.netProfit.toFixed(2) || '0.00'}`],
        ['Ticket Médio', `R$ ${metrics.averageOrderValue.toFixed(2)}`],
        ['Taxa de Conclusão', `${metrics.completionRate.toFixed(1)}%`],
        ['Receita do Período', `R$ ${periodRevenue.toFixed(2)}`],
        ['Entregas no Período', filteredDeliveries.length.toString()],
        ['Motoristas Ativos', metrics.activeDrivers.toString()],
        ['Receita por Motorista', `R$ ${metrics.revenuePerDriver.toFixed(2)}`]
      ];
      
      (doc as any).autoTable({
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      // Distribuição de status das entregas
      if (filteredDeliveries.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Status das Entregas', 20, yPosition);
        yPosition += 10;
        
        const statusData = [
          ['Pendentes', filteredDeliveries.filter(d => d.status === 'pending').length.toString()],
          ['Em Andamento', filteredDeliveries.filter(d => d.status === 'in_progress').length.toString()],
          ['Concluídas', filteredDeliveries.filter(d => d.status === 'completed').length.toString()],
          ['Canceladas', filteredDeliveries.filter(d => d.status === 'cancelled').length.toString()]
        ];
        
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Status', 'Quantidade']],
          body: statusData,
          theme: 'grid',
          headStyles: { fillColor: [46, 125, 50] },
          styles: { fontSize: 10 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 20;
      }
      
      // Top motoristas
      if (allUsers.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Motoristas por Receita', 20, yPosition);
        yPosition += 10;
        
        const topDrivers = allUsers
          .filter(u => u.userType === 'motorista')
          .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
          .slice(0, 10)
          .map((driver, index) => [
            `#${index + 1}`,
            driver.displayName,
            driver.isOnline ? 'Online' : 'Offline',
            `R$ ${(driver.totalRevenue || 0).toFixed(2)}`
          ]);
        
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Posição', 'Nome', 'Status', 'Receita']],
          body: topDrivers,
          theme: 'grid',
          headStyles: { fillColor: [156, 39, 176] },
          styles: { fontSize: 9 }
        });
      }
      
      // Rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${i} de ${pageCount}`, 20, doc.internal.pageSize.height - 10);
        doc.text('Sistema de Gestão de Entregas', doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10);
      }
      
      // Salvar arquivo
      const fileName = `relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ptBR })}.pdf`;
      doc.save(fileName);
      
      toast({
        title: 'Relatório exportado',
        description: 'O relatório financeiro foi exportado com sucesso.',
      });
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na exportação',
        description: 'Não foi possível exportar o relatório. Tente novamente.',
      });
    }
  };

  // Filtrar entregas por período
  const getFilteredDeliveries = () => {
    if (!allDeliveries.length) return [];
    
    const days = parseInt(period);
    const cutoffDate = subDays(new Date(), days);
    
    return allDeliveries.filter(delivery => {
      const deliveryDate = delivery.createdAt?.toDate ? delivery.createdAt.toDate() : new Date(delivery.createdAt);
      return deliveryDate >= cutoffDate;
    });
  };

  const filteredDeliveries = getFilteredDeliveries();

  // Calcular receita do período
  const periodRevenue = filteredDeliveries.reduce((sum, delivery) => {
    return sum + (delivery.value || 0);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
            <p className="text-muted-foreground">
              Análise detalhada dos dados financeiros do sistema
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadFinancialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>
      
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {financialStats?.totalRevenue.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Período selecionado: R$ {periodRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {financialStats?.netProfit.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Margem: {financialStats?.totalRevenue > 0 ? ((financialStats.netProfit / financialStats.totalRevenue) * 100).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {metrics.averageOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por entrega
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {metrics.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Entregas concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análises Detalhadas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Período</CardTitle>
                <CardDescription>
                  Evolução da receita nos últimos {period} dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Receita Total</span>
                    <span className="text-lg font-bold text-green-600">
                      R$ {periodRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Entregas</span>
                    <span className="text-lg font-bold">
                      {filteredDeliveries.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ticket Médio</span>
                    <span className="text-lg font-bold">
                      R$ {filteredDeliveries.length > 0 ? (periodRevenue / filteredDeliveries.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Status</CardTitle>
                <CardDescription>
                  Status das entregas no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => {
                    const count = filteredDeliveries.filter(d => d.status === status).length;
                    const percentage = filteredDeliveries.length > 0 ? (count / filteredDeliveries.length) * 100 : 0;
                    
                    const statusConfig = {
                      pending: { label: 'Pendentes', color: 'text-yellow-600', bg: 'bg-yellow-100' },
                      in_progress: { label: 'Em Andamento', color: 'text-blue-600', bg: 'bg-blue-100' },
                      completed: { label: 'Concluídas', color: 'text-green-600', bg: 'bg-green-100' },
                      cancelled: { label: 'Canceladas', color: 'text-red-600', bg: 'bg-red-100' }
                    };
                    
                    const config = statusConfig[status as keyof typeof statusConfig];
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${config.bg}`}></div>
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{count}</span>
                          <span className="text-xs text-muted-foreground ml-1">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Motoristas Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.activeDrivers}</div>
                <p className="text-sm text-muted-foreground">
                  de {allUsers.filter(u => u.userType === 'motorista').length} motoristas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Receita por Motorista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  R$ {metrics.revenuePerDriver.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Média por motorista ativo
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Entregas por Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(filteredDeliveries.length / parseInt(period)).toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Média diária no período
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entregas Recentes</CardTitle>
              <CardDescription>
                Últimas entregas do período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredDeliveries.slice(0, 10).map((delivery, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Entrega #{delivery.id?.slice(-6) || index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          {delivery.recipientName || 'Destinatário não informado'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ {(delivery.value || 0).toFixed(2)}</p>
                      <Badge variant={
                        delivery.status === 'completed' ? 'default' :
                        delivery.status === 'in_progress' ? 'secondary' :
                        delivery.status === 'cancelled' ? 'destructive' : 'outline'
                      }>
                        {delivery.status === 'completed' ? 'Concluída' :
                         delivery.status === 'in_progress' ? 'Em Andamento' :
                         delivery.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {filteredDeliveries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma entrega encontrada no período selecionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Usuários</CardTitle>
                <CardDescription>
                  Distribuição de usuários no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total de Usuários</span>
                    <span className="text-lg font-bold">{allUsers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Motoristas</span>
                    <span className="text-lg font-bold">
                      {allUsers.filter(u => u.userType === 'motorista').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Clientes</span>
                    <span className="text-lg font-bold">
                      {allUsers.filter(u => u.userType === 'cliente').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Motoristas Online</span>
                    <span className="text-lg font-bold text-green-600">
                      {metrics.activeDrivers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Motoristas</CardTitle>
                <CardDescription>
                  Motoristas com maior receita
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allUsers
                    .filter(u => u.userType === 'motorista')
                    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                    .slice(0, 5)
                    .map((driver, index) => (
                      <div key={driver.uid} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <span className="text-sm">{driver.displayName}</span>
                          {driver.isOnline && (
                            <Badge variant="default" className="text-xs">Online</Badge>
                          )}
                        </div>
                        <span className="text-sm font-bold">
                          R$ {(driver.totalRevenue || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FinancialSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function FinancialPage() {
  return (
    <Suspense fallback={<FinancialSkeleton />}>
      <FinancialContent />
    </Suspense>
  );
}