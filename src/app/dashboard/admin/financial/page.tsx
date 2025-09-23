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
    const averageOrderValue = deliveryStats.total > 0 && financialStats?.totalRevenue ? financialStats.totalRevenue / deliveryStats.total : 0;
    const revenuePerDriver = activeDrivers > 0 && financialStats?.totalRevenue ? financialStats.totalRevenue / activeDrivers : 0;
    const completionRate = deliveryStats.total > 0 ? (deliveryStats.completed / deliveryStats.total) * 100 : 0;

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
            className="bg-gray-600 text-white hover:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Relatórios Financeiros</h1>
              <p className="text-gray-600">
                Análise detalhada dos dados financeiros do sistema
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] bg-white border-gray-300 text-gray-900 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-white border-0 shadow-2xl rounded-2xl">
              <SelectItem value="7" className="text-gray-900 hover:bg-gray-50">Últimos 7 dias</SelectItem>
              <SelectItem value="30" className="text-gray-900 hover:bg-gray-50">Últimos 30 dias</SelectItem>
              <SelectItem value="90" className="text-gray-900 hover:bg-gray-50">Últimos 90 dias</SelectItem>
              <SelectItem value="365" className="text-gray-900 hover:bg-gray-50">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadFinancialData} className="bg-white/80 backdrop-blur-sm border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button size="sm" onClick={handleExportPDF} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>
      
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-900">Receita Total</CardTitle>
            <div className="w-6 h-6 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-green-600">
              R$ {financialStats?.totalRevenue.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-600">
              Período selecionado: R$ {periodRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-900">Lucro Líquido</CardTitle>
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-blue-600">
              R$ {financialStats?.netProfit.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-600">
              Margem: {financialStats?.totalRevenue && financialStats?.netProfit ? ((financialStats.netProfit / financialStats.totalRevenue) * 100).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-900">Ticket Médio</CardTitle>
            <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg flex items-center justify-center">
              <Target className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-purple-600">
              R$ {metrics.averageOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              Por entrega
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-900">Taxa de Conclusão</CardTitle>
            <div className="w-6 h-6 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-emerald-600">
              {metrics.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">
              Entregas concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análises Detalhadas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white/80 backdrop-blur-sm border-0 rounded-2xl shadow-lg p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium">Performance</TabsTrigger>
          <TabsTrigger value="deliveries" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium">Entregas</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  Receita por Período
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Evolução da receita nos últimos {period} dias
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Receita Total</span>
                    <span className="text-lg font-bold text-green-600">
                      R$ {periodRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Entregas</span>
                    <span className="text-lg font-bold text-gray-900">
                      {filteredDeliveries.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Ticket Médio</span>
                    <span className="text-lg font-bold text-gray-900">
                      R$ {filteredDeliveries.length > 0 ? (periodRevenue / filteredDeliveries.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-white" />
                  </div>
                  Distribuição de Status
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Status das entregas no período
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
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
                          <span className="text-sm font-medium text-gray-900">{config.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">{count}</span>
                          <span className="text-xs text-gray-600 ml-1">({percentage.toFixed(1)}%)</span>
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
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  Motoristas Ativos
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900">{metrics.activeDrivers}</div>
                <p className="text-sm text-gray-600">
                  de {allUsers.filter(u => u.userType === 'motorista').length} motoristas
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  Receita por Motorista
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900">
                  R$ {metrics.revenuePerDriver.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">
                  Média por motorista ativo
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  Entregas por Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-gray-900">
                  {(filteredDeliveries.length / parseInt(period)).toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">
                  Média diária no período
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                Entregas Recentes
              </CardTitle>
              <CardDescription className="text-gray-600">
                Últimas entregas do período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {filteredDeliveries.slice(0, 10).map((delivery, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Entrega #{delivery.id?.slice(-6) || index + 1}</p>
                        <p className="text-sm text-gray-600">
                          {delivery.recipientName || 'Destinatário não informado'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">R$ {(delivery.value || 0).toFixed(2)}</p>
                      <Badge variant={
                        delivery.status === 'completed' ? 'default' :
                        delivery.status === 'in_progress' ? 'secondary' :
                        delivery.status === 'cancelled' ? 'destructive' : 'outline'
                      } className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 border-0 rounded-full shadow-sm">
                        {delivery.status === 'completed' ? 'Concluída' :
                         delivery.status === 'in_progress' ? 'Em Andamento' :
                         delivery.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {filteredDeliveries.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-900">Nenhuma entrega encontrada no período selecionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  Resumo de Usuários
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Distribuição de usuários no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total de Usuários</span>
                    <span className="text-lg font-bold text-gray-900">{allUsers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Motoristas</span>
                    <span className="text-lg font-bold text-gray-900">
                      {allUsers.filter(u => u.userType === 'motorista').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Clientes</span>
                    <span className="text-lg font-bold text-gray-900">
                      {allUsers.filter(u => u.userType === 'cliente').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Motoristas Online</span>
                    <span className="text-lg font-bold text-green-600">
                      {metrics.activeDrivers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  Top Motoristas
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Motoristas com maior receita
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  {allUsers
                    .filter(u => u.userType === 'motorista')
                    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                    .slice(0, 5)
                    .map((driver, index) => (
                      <div key={driver.uid} className="flex items-center justify-between p-2 bg-white/50 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                          <span className="text-sm text-gray-900">{driver.displayName}</span>
                          {driver.isOnline && (
                            <Badge variant="default" className="text-xs bg-gradient-to-r from-green-600/10 to-green-500/10 text-green-600 border-0 rounded-full shadow-sm">Online</Badge>
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-900">
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="relative z-10">
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