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
  Activity,
  MessageCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { 
  getTransactions,
  type Transaction
} from '@/services/transactions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
// Removido - debug não é mais necessário

// Tipos para os dados financeiros
interface FinancialData {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  km: number;
  fuel: number;
}

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averagePerKm: number;
  fuelEfficiency: number;
  profitMargin: number;
  transactionCount: number;
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
    averagePerKm: 0,
    fuelEfficiency: 0,
    profitMargin: 0,
    transactionCount: 0
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
        const transactions = await getTransactions(user.uid);
        console.log('✅ Transações encontradas:', transactions.length);
        
        // Filtrar por período
        const filteredTransactions = transactions.filter(transaction => {
          const transactionDate = transaction.date instanceof Date ? transaction.date : transaction.date.toDate();
          return transactionDate >= startDate && transactionDate <= endDate;
        });
        
        // Converter transações para formato do gráfico
        const chartData = filteredTransactions.map(transaction => ({
          date: format(transaction.date instanceof Date ? transaction.date : transaction.date.toDate(), 'yyyy-MM-dd'),
          revenue: transaction.type === 'receita' ? transaction.amount : 0,
          expenses: transaction.type === 'despesa' ? transaction.amount : 0,
          profit: transaction.type === 'receita' ? transaction.amount : -transaction.amount,
          km: transaction.km || 0,
          fuel: transaction.category === 'Combustível' ? (transaction.amount / (transaction.pricePerLiter || 1)) : 0
        }));

        // Agrupar por data
        const groupedData = chartData.reduce((acc, item) => {
          const existing = acc.find(d => d.date === item.date);
                     if (existing) {
             existing.revenue += item.revenue;
             existing.expenses += item.expenses;
             existing.profit += item.profit;
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
        
        const revenueTransactions = filteredTransactions.filter(t => t.type === 'receita');
        const expenseTransactions = filteredTransactions.filter(t => t.type === 'despesa');
        
        const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
        const netProfit = totalRevenue - totalExpenses;
        
        // Calcular métricas baseadas em KM e combustível
        const totalKm = filteredTransactions.reduce((sum, t) => sum + (t.km || 0), 0);
        const totalFuel = filteredTransactions
          .filter(t => t.category === 'Combustível')
          .reduce((sum, t) => sum + (t.amount / (t.pricePerLiter || 1)), 0);
        
        const averagePerKm = totalKm > 0 ? netProfit / totalKm : 0;
        const fuelEfficiency = totalFuel > 0 ? totalKm / totalFuel : 0;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        
        setMetrics({
          totalRevenue,
          totalExpenses,
          netProfit,
          averagePerKm,
          fuelEfficiency,
          profitMargin,
          transactionCount: filteredTransactions.length
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
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Relatório Financeiro', 20, 20);
      
      // Período
      doc.setFontSize(12);
      doc.text(`Período: ${timeRange === '7d' ? 'Últimos 7 dias' : timeRange === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}`, 20, 35);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);
      
      // Métricas principais
      doc.setFontSize(14);
      doc.text('Métricas Principais', 20, 65);
      
      const metricsData = [
        ['Receita Total', `R$ ${metrics.totalRevenue.toFixed(2)}`],
        ['Lucro Líquido', `R$ ${metrics.netProfit.toFixed(2)}`],
        ['Total de Transações', metrics.transactionCount.toString()],
        ['Eficiência Combustível', `${metrics.fuelEfficiency.toFixed(1)} km/L`]
      ];
      
      autoTable(doc, {
        startY: 75,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 10 }
      });
      
      // Dados detalhados
      doc.setFontSize(14);
      doc.text('Dados Detalhados', 20, 140);
      
      const tableData = financialData.map(item => [
        format(new Date(item.date), 'dd/MM/yyyy'),
        `R$ ${item.revenue.toFixed(2)}`,
        `R$ ${item.expenses.toFixed(2)}`,
        `R$ ${item.profit.toFixed(2)}`,
        `${item.km}km`,
        `${item.fuel.toFixed(1)}L`
      ]);
      
      autoTable(doc, {
        startY: 150,
        head: [['Data', 'Receita', 'Despesas', 'Lucro', 'KM', 'Combustível']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      });
      
      // Salvar arquivo
      const fileName = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
    }
  };

  const exportToExcel = () => {
    try {
      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Dados das métricas
      const metricsSheet = [
        ['Métrica', 'Valor'],
        ['Receita Total', `R$ ${metrics.totalRevenue.toFixed(2)}`],
        ['Lucro Líquido', `R$ ${metrics.netProfit.toFixed(2)}`],
        ['Total de Transações', metrics.transactionCount],
        ['Eficiência Combustível', `${metrics.fuelEfficiency.toFixed(1)} km/L`],
        ['Período', timeRange === '7d' ? 'Últimos 7 dias' : timeRange === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'],
        ['Gerado em', format(new Date(), 'dd/MM/yyyy HH:mm')]
      ];
      
      const metricsWS = XLSX.utils.aoa_to_sheet(metricsSheet);
      XLSX.utils.book_append_sheet(wb, metricsWS, 'Métricas');
      
      // Dados detalhados
      const detailsSheet = [
        ['Data', 'Receita', 'Despesas', 'Lucro', 'KM', 'Combustível'],
        ...financialData.map(item => [
          format(new Date(item.date), 'dd/MM/yyyy'),
          item.revenue,
          item.expenses,
          item.profit,
          item.km,
          item.fuel
        ])
      ];
      
      const detailsWS = XLSX.utils.aoa_to_sheet(detailsSheet);
      XLSX.utils.book_append_sheet(wb, detailsWS, 'Dados Detalhados');
      
      // Salvar arquivo
      const fileName = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao exportar Excel. Tente novamente.');
    }
  };

  const sendReport = () => {
    try {
      // Gerar PDF temporário
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Relatório Financeiro', 20, 20);
      
      // Período
      doc.setFontSize(12);
      doc.text(`Período: ${timeRange === '7d' ? 'Últimos 7 dias' : timeRange === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}`, 20, 35);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);
      
      // Métricas principais
      doc.setFontSize(14);
      doc.text('Métricas Principais', 20, 65);
      
      const metricsData = [
        ['Receita Total', `R$ ${metrics.totalRevenue.toFixed(2)}`],
        ['Lucro Líquido', `R$ ${metrics.netProfit.toFixed(2)}`],
        ['Total de Transações', metrics.transactionCount.toString()],
        ['Eficiência Combustível', `${metrics.fuelEfficiency.toFixed(1)} km/L`]
      ];
      
      autoTable(doc, {
        startY: 75,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 10 }
      });
      
      // Dados detalhados
      doc.setFontSize(14);
      doc.text('Dados Detalhados', 20, 140);
      
      const tableData = financialData.map(item => [
        format(new Date(item.date), 'dd/MM/yyyy'),
        `R$ ${item.revenue.toFixed(2)}`,
        `R$ ${item.expenses.toFixed(2)}`,
        `R$ ${item.profit.toFixed(2)}`,
        `${item.km}km`,
        `${item.fuel.toFixed(1)}L`
      ]);
      
      autoTable(doc, {
        startY: 150,
        head: [['Data', 'Receita', 'Despesas', 'Lucro', 'KM', 'Combustível']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      });
      
      // Converter para blob
      const pdfBlob = doc.output('blob');
      
      // Criar link de email
      const subject = encodeURIComponent('Relatório Financeiro - Dashboard');
      const body = encodeURIComponent(`
Olá,

Segue em anexo o relatório financeiro do período ${timeRange === '7d' ? 'últimos 7 dias' : timeRange === '30d' ? 'últimos 30 dias' : 'últimos 90 dias'}.

Resumo:
- Receita Total: R$ ${metrics.totalRevenue.toFixed(2)}
- Lucro Líquido: R$ ${metrics.netProfit.toFixed(2)}
- Total de Transações: ${metrics.transactionCount}
- Eficiência Combustível: ${metrics.fuelEfficiency.toFixed(1)} km/L

Atenciosamente,
Sistema de Dashboard Financeiro
      `);
      
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      // Abrir cliente de email
      window.open(mailtoLink);
      
      // Simular anexo (em um ambiente real, você enviaria via API)
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        link.click();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      alert('Erro ao enviar relatório. Tente novamente.');
    }
  };

  const sendViaWhatsApp = () => {
    try {
      // Gerar PDF temporário
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Relatório Financeiro', 20, 20);
      
      // Período
      doc.setFontSize(12);
      doc.text(`Período: ${timeRange === '7d' ? 'Últimos 7 dias' : timeRange === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}`, 20, 35);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);
      
      // Métricas principais
      doc.setFontSize(14);
      doc.text('Métricas Principais', 20, 65);
      
      const metricsData = [
        ['Receita Total', `R$ ${metrics.totalRevenue.toFixed(2)}`],
        ['Lucro Líquido', `R$ ${metrics.netProfit.toFixed(2)}`],
        ['Total de Transações', metrics.transactionCount.toString()],
        ['Eficiência Combustível', `${metrics.fuelEfficiency.toFixed(1)} km/L`]
      ];
      
      autoTable(doc, {
        startY: 75,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 10 }
      });
      
      // Dados detalhados
      doc.setFontSize(14);
      doc.text('Dados Detalhados', 20, 140);
      
      const tableData = financialData.map(item => [
        format(new Date(item.date), 'dd/MM/yyyy'),
        `R$ ${item.revenue.toFixed(2)}`,
        `R$ ${item.expenses.toFixed(2)}`,
        `R$ ${item.profit.toFixed(2)}`,
        `${item.km}km`,
        `${item.fuel.toFixed(1)}L`
      ]);
      
      autoTable(doc, {
        startY: 150,
        head: [['Data', 'Receita', 'Despesas', 'Lucro', 'KM', 'Combustível']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      });
      
      // Converter para blob
      const pdfBlob = doc.output('blob');
      
      // Criar link do WhatsApp
      const message = encodeURIComponent(`
📊 *Relatório Financeiro*

Período: ${timeRange === '7d' ? 'Últimos 7 dias' : timeRange === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}

💰 *Resumo:*
• Receita Total: R$ ${metrics.totalRevenue.toFixed(2)}
• Lucro Líquido: R$ ${metrics.netProfit.toFixed(2)}
• Total de Transações: ${metrics.transactionCount}
• Eficiência Combustível: ${metrics.fuelEfficiency.toFixed(1)} km/L

📄 O relatório completo em PDF será enviado em seguida.
      `);
      
      const whatsappLink = `https://wa.me/?text=${message}`;
      
      // Abrir WhatsApp
      window.open(whatsappLink, '_blank');
      
      // Fazer download do PDF automaticamente
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        link.click();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao enviar via WhatsApp:', error);
      alert('Erro ao enviar via WhatsApp. Tente novamente.');
    }
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
          <Button variant="outline" size="sm" onClick={sendViaWhatsApp} className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
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
           title="Total de Transações"
           value={metrics.transactionCount.toString()}
           icon={<BarChart3 className="h-4 w-4" />}
           description="Número total de transações no período"
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
                                         <td className="text-right p-2">{item.km}km</td>
                     <td className="text-right p-2">{item.fuel.toFixed(1)}L</td>
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
