'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Car, 
  Fuel, 
  Calendar,
  Download,
  Mail,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { 
  getUserTransactions, 
  calculateFinancialMetrics, 
  type FinancialTransaction,
  type FinancialMetrics as RealFinancialMetrics 
} from '@/services/financial';
// Removido - debug não é mais necessário

// Tipos para os dados financeiros
interface FinancialData {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  hours: number;
  km: number;
  fuel: number;
}

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averagePerHour: number;
  averagePerKm: number;
  fuelEfficiency: number;
  profitMargin: number;
}

// Componente de métrica individual
interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, isPositive, icon, description }: MetricCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs flex items-center gap-1 ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Componente principal do Dashboard Financeiro
export function FinancialDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    averagePerHour: 0,
    averagePerKm: 0,
    fuelEfficiency: 0,
    profitMargin: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados reais do Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const loadFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Iniciando carregamento de dados financeiros...');
        console.log('👤 User ID:', user.uid);

        // Removido - debug não é mais necessário

        // Calcular período baseado na seleção
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        }

        console.log('📅 Período:', { startDate, endDate });

        // Buscar transações reais
        console.log('🔍 Buscando transações...');
        const transactions = await getUserTransactions(user.uid, startDate, endDate);
        console.log('✅ Transações encontradas:', transactions.length);
        
        // Converter transações para formato do gráfico
        const chartData = transactions.map(transaction => ({
          date: format(transaction.date, 'yyyy-MM-dd'),
          revenue: transaction.type === 'revenue' ? transaction.amount : 0,
          expenses: transaction.type === 'expense' ? transaction.amount : 0,
          profit: transaction.type === 'revenue' ? transaction.amount : -transaction.amount,
          hours: transaction.hours || 0,
          km: transaction.km || 0,
          fuel: transaction.fuel || 0
        }));

        // Agrupar por data
        const groupedData = chartData.reduce((acc, item) => {
          const existing = acc.find(d => d.date === item.date);
          if (existing) {
            existing.revenue += item.revenue;
            existing.expenses += item.expenses;
            existing.profit += item.profit;
            existing.hours += item.hours;
            existing.km += item.km;
            existing.fuel += item.fuel;
          } else {
            acc.push({ ...item });
          }
          return acc;
        }, [] as FinancialData[]);

        // Ordenar por data
        groupedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setFinancialData(groupedData);

        // Calcular métricas reais
        console.log('📊 Calculando métricas...');
        const realMetrics = await calculateFinancialMetrics(user.uid, startDate, endDate);
        console.log('✅ Métricas calculadas:', realMetrics);
        
        setMetrics({
          totalRevenue: realMetrics.totalRevenue,
          totalExpenses: realMetrics.totalExpenses,
          netProfit: realMetrics.netProfit,
          averagePerHour: realMetrics.averagePerHour,
          averagePerKm: realMetrics.averagePerKm,
          fuelEfficiency: realMetrics.fuelEfficiency,
          profitMargin: realMetrics.profitMargin
        });

        console.log('🎉 Dados carregados com sucesso!');

      } catch (err) {
        console.error('❌ Erro ao carregar dados financeiros:', err);
        
        // Erro mais detalhado
        let errorMessage = 'Erro ao carregar dados financeiros.';
        
        if (err instanceof Error) {
          if (err.message.includes('permission-denied')) {
            errorMessage = 'Sem permissão para acessar os dados. Verifique se está logado.';
          } else if (err.message.includes('unavailable')) {
            errorMessage = 'Serviço temporariamente indisponível. Tente novamente.';
          } else if (err.message.includes('not-found')) {
            errorMessage = 'Dados não encontrados. Você pode não ter transações ainda.';
          } else {
            errorMessage = `Erro: ${err.message}`;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadFinancialData();
  }, [user?.uid, timeRange]);

  // Dados para gráficos
  const chartData = financialData.map(item => ({
    ...item,
    date: format(new Date(item.date), 'dd/MM'),
    profit: item.profit
  }));

  const pieData = [
    { name: 'Lucro', value: metrics.netProfit, color: '#10b981' },
    { name: 'Despesas', value: metrics.totalExpenses, color: '#ef4444' }
  ];

  // Funções de exportação
  const exportToPDF = () => {
    // Implementar exportação para PDF
    console.log('Exportando para PDF...');
  };

  const exportToExcel = () => {
    // Implementar exportação para Excel
    console.log('Exportando para Excel...');
  };

  const sendReport = () => {
    // Implementar envio por email
    console.log('Enviando relatório por email...');
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
            <p className="text-muted-foreground">
              Carregando dados financeiros...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar erro
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
            <p className="text-muted-foreground">
              Erro ao carregar dados
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com título e controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Acompanhe seus ganhos, despesas e lucros em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={sendReport}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('🔍 Debug removido - não é mais necessário');
                alert('Debug removido - funcionalidade não é mais necessária');
              }}
              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            >
              🐛 Debug
            </Button>
          )}
        </div>
      </div>

      {/* Seletor de período */}
      <div className="flex justify-center">
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <TabsList>
            <TabsTrigger value="7d">Últimos 7 dias</TabsTrigger>
            <TabsTrigger value="30d">Últimos 30 dias</TabsTrigger>
            <TabsTrigger value="90d">Últimos 90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Receita Total"
          value={`R$ ${metrics.totalRevenue.toFixed(2)}`}
          change={`+${((metrics.totalRevenue / 100) - 1) * 100}%`}
          isPositive={true}
          icon={<DollarSign className="h-4 w-4" />}
          description="Soma de todas as entradas"
        />
        
        <MetricCard
          title="Lucro Líquido"
          value={`R$ ${metrics.netProfit.toFixed(2)}`}
          change={`${metrics.profitMargin.toFixed(1)}%`}
          isPositive={metrics.netProfit >= 0}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Receita menos despesas"
        />
        
        <MetricCard
          title="Média por Hora"
          value={`R$ ${metrics.averagePerHour.toFixed(2)}`}
          icon={<Clock className="h-4 w-4" />}
          description="Lucro médio por hora trabalhada"
        />
        
        <MetricCard
          title="Eficiência Combustível"
          value={`${metrics.fuelEfficiency.toFixed(1)} km/L`}
          icon={<Fuel className="h-4 w-4" />}
          description="Quilômetros por litro"
        />
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Evolução do Lucro ao Longo do Tempo
              </CardTitle>
              <CardDescription>
                Acompanhe como seus ganhos evoluem dia a dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Lucro']}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribuição: Lucro vs Despesas
              </CardTitle>
              <CardDescription>
                Visualize a proporção entre seus ganhos e gastos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparativo: Receita vs Despesas
              </CardTitle>
              <CardDescription>
                Compare receitas e despesas por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="#10b981" name="Receita" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tabela de dados detalhados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Detalhados</CardTitle>
          <CardDescription>
            Visualize todos os dados financeiros do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-right p-2">Receita</th>
                  <th className="text-right p-2">Despesas</th>
                  <th className="text-right p-2">Lucro</th>
                  <th className="text-right p-2">Horas</th>
                  <th className="text-right p-2">KM</th>
                  <th className="text-right p-2">Combustível</th>
                </tr>
              </thead>
              <tbody>
                {financialData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                    <td className="text-right p-2 text-green-600">R$ {item.revenue.toFixed(2)}</td>
                    <td className="text-right p-2 text-red-600">R$ {item.expenses.toFixed(2)}</td>
                    <td className={`text-right p-2 font-medium ${
                      item.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {item.profit.toFixed(2)}
                    </td>
                    <td className="text-right p-2">{item.hours}h</td>
                    <td className="text-right p-2">{item.km}km</td>
                    <td className="text-right p-2">{item.fuel}L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
