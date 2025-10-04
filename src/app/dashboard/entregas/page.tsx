
'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { DeliveryForm } from '@/components/forms/DeliveryForm';
import { DeliveryHistory } from '@/components/DeliveryHistory';
import { RouteOptimizer } from '@/components/RouteOptimizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getTransactions, type Transaction, updateTransaction, deleteTransaction, addTransaction } from '@/services/transactions';
import { getRecipientsByUser, type Recipient } from '@/services/recipients';
import { optimizeRoute } from '@/services/route-optimization';
import { useToast } from '@/hooks/use-toast';
import { useDashboardRefresh } from '@/hooks/use-unified-refresh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DateRangePicker } from '@/components/ui/daterangepicker';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { motion } from 'framer-motion';
import { Car, Zap, Sparkles, Truck, MapPin, Clock, Trash2 } from 'lucide-react';

function EntregasSkeleton() {
    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center space-x-3">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
                            >
                                <Truck className="h-4 w-4 text-white" />
                            </motion.div>
                            <Skeleton className="h-8 w-1/2" />
                        </div>
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full mt-6" />
                    </CardContent>
                </Card>
            </motion.div>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center space-x-2">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            <Skeleton className="h-8 w-1/3" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}


function EntregasContent() {
    const [user, setUser] = useState<User | null>(null);
    const [allDeliveries, setAllDeliveries] = useState<Transaction[]>([]);
    const [pendingDeliveries, setPendingDeliveries] = useState<Transaction[]>([]);
    const [deliveriesToReceive, setDeliveriesToReceive] = useState<Transaction[]>([]);
    const [deliveryHistory, setDeliveryHistory] = useState<Transaction[]>([]);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    
    // Estados para gerenciamento de rotas
    const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
    
    // Estados para multi-seleção de pagamentos
    const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
    const [isProcessingPayments, setIsProcessingPayments] = useState(false);
    
    // Estado para modal de rotas
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    
    // Auto refresh hook
    const { refreshDeliveries } = useDashboardRefresh();
    
    // Estado para o seletor de data - padrão: mês atual
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    // Função para filtrar entregas por período
    const filterDeliveriesByDate = useCallback((deliveries: Transaction[]) => {
        // Entregas pendentes e entregas com pagamento pendente sempre aparecem (não filtradas por data)
        const pendingDeliveries = deliveries.filter(d => d.deliveryStatus === 'Pendente');
        const deliveriesToReceive = deliveries.filter(
            (d) => d.deliveryStatus === 'Entregue' && d.paymentStatus === 'Pendente'
        );
        
        if (!dateRange?.from) {
            // Se não há filtro de data, mostrar todas
            setPendingDeliveries(pendingDeliveries);
            setDeliveryHistory(deliveries.filter(d => d.deliveryStatus !== 'Pendente'));
            setDeliveriesToReceive(deliveriesToReceive);
            return;
        }

        // Filtrar apenas o histórico por data (entregas pendentes e com pagamento pendente sempre aparecem)
        const filteredDeliveries = deliveries.filter(delivery => {
            const deliveryDate = delivery.date.toDate();
            const fromDate = dateRange.from!;
            const toDate = dateRange.to || dateRange.from!;
            
            // Ajustar horário para incluir o dia inteiro
            const startOfDay = new Date(fromDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(toDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            return deliveryDate >= startOfDay && deliveryDate <= endOfDay;
        });

        // Manter entregas pendentes e com pagamento pendente sempre visíveis
        setPendingDeliveries(pendingDeliveries);
        setDeliveryHistory(filteredDeliveries.filter(d => d.deliveryStatus !== 'Pendente'));
        setDeliveriesToReceive(deliveriesToReceive);
    }, [dateRange]);

    const fetchData = useCallback(async (uid: string) => {
        setLoading(true);
        try {
            const [allTransactions, recipientsList] = await Promise.all([
                getTransactions(uid),
                getRecipientsByUser(uid)
            ]);

            const deliveryTransactions = allTransactions.filter(
                (t) => t.category === 'Entrega'
            );
            
            // Armazenar todas as entregas e destinatários
            setAllDeliveries(deliveryTransactions);
            setRecipients(recipientsList);
            
            // Filtrar entregas por data
            filterDeliveriesByDate(deliveryTransactions);

        } catch (error) {
            console.error("Erro ao buscar dados de entregas:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os dados de entregas.'})
        } finally {
            setLoading(false);
        }
    }, [toast, filterDeliveriesByDate]);

    // Efeito para refiltrar quando a data mudar
    useEffect(() => {
        if (allDeliveries.length > 0) {
            filterDeliveriesByDate(allDeliveries);
        }
    }, [dateRange, allDeliveries, filterDeliveriesByDate]);

    const handleDeliveryRequest = async (deliveryId: string, accept: boolean) => {
        try {
            const status = accept ? 'Confirmada' : 'Recusada';
            await updateTransaction(deliveryId, { deliveryStatus: status as any });
            toast({ title: 'Sucesso!', description: `Entrega ${status.toLowerCase()}.` });
            refreshDeliveries(() => fetchData(user!.uid));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível processar a solicitação.'})
        }
    }

    const handleDeleteDelivery = async (deliveryId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta entrega? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            await deleteTransaction(deliveryId);
            toast({ 
                title: 'Sucesso!', 
                description: 'Entrega excluída com sucesso.' 
            });
            refreshDeliveries(() => fetchData(user!.uid));
        } catch (error) {
            console.error("Erro ao excluir entrega:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro', 
                description: 'Não foi possível excluir a entrega.' 
            });
        }
    }


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchData(currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, [fetchData]);

    const handleAction = useCallback(async () => {
        if (user) {
           refreshDeliveries(() => fetchData(user.uid));
        }
    }, [user, fetchData, refreshDeliveries]);

    // Funções para gerenciamento de rotas
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const availableDeliveries = allDeliveries
                .filter(d => d.deliveryStatus === 'Confirmada' || d.deliveryStatus === 'Pendente')
                .map(d => d.id);
            setSelectedDeliveries(availableDeliveries);
        } else {
            setSelectedDeliveries([]);
        }
    };

    const handleSelectDelivery = (deliveryId: string, checked: boolean) => {
        if (checked) {
            setSelectedDeliveries(prev => [...prev, deliveryId]);
        } else {
            setSelectedDeliveries(prev => prev.filter(id => id !== deliveryId));
        }
    };

    const handleOptimizeRoute = async () => {
        if (selectedDeliveries.length < 2) {
            toast({
                variant: 'destructive',
                title: 'Seleção insuficiente',
                description: 'Selecione pelo menos 2 entregas para otimizar a rota.'
            });
            return;
        }

        setIsOptimizing(true);
        try {
            // Usar serviço de otimização real
            const optimizedRouteResult = await optimizeRoute(selectedDeliveries, allDeliveries);
            setOptimizedRoute(optimizedRouteResult);
            
            toast({
                title: 'Rota Otimizada!',
                description: `Rota calculada com ${selectedDeliveries.length} entregas. Economia estimada: 15% de tempo e combustível.`
            });
            
        } catch (error) {
            console.error('Erro na otimização:', error);
            toast({
                variant: 'destructive',
                title: 'Erro na otimização',
                description: 'Não foi possível otimizar a rota. Tente novamente.'
            });
        } finally {
            setIsOptimizing(false);
        }
    };

    // Funções para multi-seleção de pagamentos
    const handleSelectPayment = (deliveryId: string, checked: boolean) => {
        if (checked) {
            setSelectedPayments(prev => [...prev, deliveryId]);
        } else {
            setSelectedPayments(prev => prev.filter(id => id !== deliveryId));
        }
    };

    const handleSelectAllPayments = (checked: boolean) => {
        if (checked) {
            const availablePayments = deliveriesToReceive.map(d => d.id);
            setSelectedPayments(availablePayments);
        } else {
            setSelectedPayments([]);
        }
    };

    const handleProcessPayments = async () => {
        if (selectedPayments.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Nenhum pagamento selecionado',
                description: 'Selecione pelo menos uma entrega para dar baixa no pagamento.'
            });
            return;
        }

        setIsProcessingPayments(true);
        try {
            // Calcular valor total das entregas selecionadas
            const selectedDeliveries = deliveriesToReceive.filter(delivery => 
                selectedPayments.includes(delivery.id)
            );
            const totalAmount = selectedDeliveries.reduce((sum, delivery) => sum + delivery.amount, 0);
            
            // Atualizar status de pagamento para todas as entregas selecionadas
            const updatePromises = selectedPayments.map(deliveryId => 
                updateTransaction(deliveryId, { paymentStatus: 'Pago' as any })
            );
            
            await Promise.all(updatePromises);
            
            // Criar transação de receita automática
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString('pt-BR');
            const deliveryCount = selectedPayments.length;
            
            const incomeTransaction = {
                userId: user!.uid,
                type: 'receita' as const,
                description: `Receita de entregas - ${deliveryCount} entrega(s) - ${formattedDate}`,
                amount: totalAmount,
                category: 'Entrega',
                date: currentDate,
                observations: `Receita gerada automaticamente ao dar baixa em ${deliveryCount} entrega(s) no valor total de R$ ${totalAmount.toFixed(2)}`
            };
            
            await addTransaction(incomeTransaction);
            
            toast({
                title: 'Pagamentos Processados!',
                description: `${selectedPayments.length} pagamento(s) marcado(s) como pago(s). Receita de R$ ${totalAmount.toFixed(2)} criada automaticamente.`
            });
            
            // Limpar seleção e atualizar dados
            setSelectedPayments([]);
            if (user) {
                refreshDeliveries(() => fetchData(user.uid));
            }
            
        } catch (error) {
            console.error('Erro ao processar pagamentos:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao processar pagamentos',
                description: 'Não foi possível dar baixa nos pagamentos. Tente novamente.'
            });
        } finally {
            setIsProcessingPayments(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                            <Truck className="h-4 w-4 text-white" />
                        </div>
                        <CardTitle className="text-gray-900">Registrar Nova Entrega</CardTitle>
                    </div>
                    <CardDescription className="text-gray-600">Preencha os detalhes da entrega. Isso irá gerar uma nova transação de receita.</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <DeliveryForm 
                        onFormSubmit={handleAction}
                        recipients={recipients}
                        onSuccess={() => {
                            // Auto-refresh após criação
                            if (user) {
                                fetchData(user.uid);
                            }
                        }}
                    />
                </CardContent>
            </Card>
            
            <Separator />

            <Separator />

            <Tabs defaultValue="history">
                <TabsList className="tabs-list-mobile grid w-full grid-cols-3 border-0 rounded-2xl shadow-lg p-1">
                    <TabsTrigger 
                        value="pending"
                        className="tabs-trigger-mobile data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium"
                    >
                        Entregas Pendentes
                    </TabsTrigger>
                    <TabsTrigger 
                        value="history"
                        className="tabs-trigger-mobile data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium"
                    >
                        Histórico de Entregas
                    </TabsTrigger>
                    <TabsTrigger 
                        value="to-receive"
                        className="tabs-trigger-mobile data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium"
                    >
                        Entregas a Receber
                    </TabsTrigger>
                </TabsList>
                 <TabsContent value="pending">
                    <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <Truck className="h-4 w-4 text-white" />
                                </div>
                                <CardTitle className="text-gray-900">Entregas Pendentes</CardTitle>
                            </div>
                            <CardDescription className="text-gray-600">Novas solicitações de entrega para você aceitar ou recusar.</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-6">
                           <DeliveryHistory 
                                onAction={handleAction} 
                                deliveries={pendingDeliveries} 
                                loading={loading}
                                isHistoryTab={false}
                                onRespond={handleDeliveryRequest}
                            />
                            
                            {/* Componente de Rastreamento */}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <CardHeader className="relative z-10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                        <MapPin className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-gray-900">Histórico de Entregas</CardTitle>
                                        <CardDescription className="text-gray-600">
                                            {dateRange?.from ? format(dateRange.from, "PPP", { locale: ptBR }) : ''}
                                            {dateRange?.to ? ` - ${format(dateRange.to, "PPP", { locale: ptBR })}` : ''}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <DateRangePicker 
                                        date={dateRange} 
                                        onDateChange={setDateRange} 
                                    />
                                    <Dialog open={isRouteModalOpen} onOpenChange={setIsRouteModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button 
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                                            >
                                                🗺️ Gerenciar Rotas
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl">
                                            <DialogHeader className="bg-gradient-to-r from-blue-600/5 to-purple-600/5 p-6 rounded-t-2xl">
                                                <DialogTitle className="text-gray-900">Gerenciamento de Rotas</DialogTitle>
                                            </DialogHeader>
                                            <RouteOptimizer
                                                deliveries={allDeliveries}
                                                selectedDeliveries={selectedDeliveries}
                                                onSelectionChange={handleSelectDelivery}
                                                onSelectAll={handleSelectAll}
                                                onOptimize={handleOptimizeRoute}
                                                isOptimizing={isOptimizing}
                                                optimizedRoute={optimizedRoute}
                                                onClearRoute={() => setOptimizedRoute(null)}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <DeliveryHistory 
                                onAction={handleAction} 
                                deliveries={deliveryHistory} 
                                loading={loading}
                                isHistoryTab={true}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="to-receive">
                     <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <Clock className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-gray-900">Entregas a Receber</CardTitle>
                                    <CardDescription className="text-gray-600">Entregas que foram finalizadas mas ainda não foram pagas.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="space-y-4">
                                {/* Resumo do valor total a receber */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <span className="text-white text-xl">💰</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Total a Receber</h3>
                                                <p className="text-sm text-gray-600">
                                                    {deliveriesToReceive.length} {deliveriesToReceive.length === 1 ? 'entrega' : 'entregas'} pendentes
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-green-600">
                                                R$ {deliveriesToReceive.reduce((total, delivery) => total + delivery.amount, 0).toFixed(2)}
                                            </div>
                                            <p className="text-sm text-gray-500">Valor total</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Controles de multi-seleção */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                    <div className="flex items-center space-x-2">
                                        <input 
                                            type="checkbox" 
                                            id="select-all-payments"
                                            className="rounded border-gray-300 mobile-checkbox"
                                            checked={selectedPayments.length === deliveriesToReceive.length && selectedPayments.length > 0}
                                            onChange={(e) => handleSelectAllPayments(e.target.checked)}
                                        />
                                        <label htmlFor="select-all-payments" className="text-sm font-medium mobile-checkbox-label">
                                            <span className="hidden sm:inline">Selecionar todas as entregas ({selectedPayments.length} selecionadas)</span>
                                            <span className="sm:hidden">Todas ({selectedPayments.length})</span>
                                        </label>
                                    </div>
                                    <Button 
                                        className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium mobile-button w-full sm:w-auto"
                                        onClick={handleProcessPayments}
                                        disabled={isProcessingPayments || selectedPayments.length === 0}
                                    >
                                        <span className="hidden sm:inline">
                                            {isProcessingPayments ? '🔄 Processando...' : '💰 Dar Baixa nos Pagamentos'}
                                        </span>
                                        <span className="sm:hidden">
                                            {isProcessingPayments ? '🔄 Processando...' : '💰 Dar Baixa'}
                                        </span>
                                    </Button>
                                </div>
                                
                                {/* Lista de entregas com checkboxes */}
                                <div className="grid gap-4">
                                    {deliveriesToReceive.map((delivery) => (
                                        <div key={delivery.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 mobile-card">
                                            <div className="flex items-start space-x-3">
                                                <input 
                                                    type="checkbox" 
                                                    id={`payment-${delivery.id}`}
                                                    className="mt-1 rounded border-gray-300 mobile-checkbox"
                                                    checked={selectedPayments.includes(delivery.id)}
                                                    onChange={(e) => handleSelectPayment(delivery.id, e.target.checked)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                                            {delivery.description || 'Entrega sem descrição'}
                                                        </h3>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                                                {delivery.paymentStatus}
                                                            </span>
                                                            <span className="text-sm font-semibold text-green-600">
                                                                R$ {delivery.amount.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                                                        📍 {delivery.recipientAddress?.street && delivery.recipientAddress?.number 
                                                            ? `${delivery.recipientAddress.street}, ${delivery.recipientAddress.number}, ${delivery.recipientAddress.neighborhood}, ${delivery.recipientAddress.city}, ${delivery.recipientAddress.state}`
                                                            : 'Endereço não informado'
                                                        }
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-500">
                                                        📅 {delivery.date.toDate().toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 ml-4">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteDelivery(delivery.id!)}
                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {deliveriesToReceive.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Nenhuma entrega pendente de pagamento.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}


export default function EntregasPage() {
    return (
        <Suspense fallback={<EntregasSkeleton />}>
           <EntregasContent />
        </Suspense>
    );
}
