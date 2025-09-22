
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
import { getTransactions, type Transaction, updateTransaction } from '@/services/transactions';
import { getRecipientsByUser, type Recipient } from '@/services/recipients';
import { optimizeRoute } from '@/services/route-optimization';
import { useToast } from '@/hooks/use-toast';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/daterangepicker';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

function EntregasSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
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
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
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
    
    // Auto refresh hook
    const { refreshWithDelay } = useAutoRefresh();
    
    // Estado para o seletor de data - padrão: mês atual
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    // Função para filtrar entregas por período
    const filterDeliveriesByDate = useCallback((deliveries: Transaction[]) => {
        if (!dateRange?.from) {
            // Se não há filtro de data, mostrar todas
            setPendingDeliveries(deliveries.filter(d => d.deliveryStatus === 'Pendente'));
            setDeliveryHistory(deliveries.filter(d => d.deliveryStatus !== 'Pendente'));
            setDeliveriesToReceive(deliveries.filter(
                (d) => d.deliveryStatus === 'Entregue' && d.paymentStatus === 'Pendente'
            ));
            return;
        }

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

        setPendingDeliveries(filteredDeliveries.filter(d => d.deliveryStatus === 'Pendente'));
        setDeliveryHistory(filteredDeliveries.filter(d => d.deliveryStatus !== 'Pendente'));
        setDeliveriesToReceive(filteredDeliveries.filter(
            (d) => d.deliveryStatus === 'Entregue' && d.paymentStatus === 'Pendente'
        ));
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
            refreshWithDelay(() => fetchData(user!.uid));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível processar a solicitação.'})
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
           refreshWithDelay(() => fetchData(user.uid));
        }
    }, [user, fetchData, refreshWithDelay]);

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
            // Atualizar status de pagamento para todas as entregas selecionadas
            const updatePromises = selectedPayments.map(deliveryId => 
                updateTransaction(deliveryId, { paymentStatus: 'Pago' as any })
            );
            
            await Promise.all(updatePromises);
            
            toast({
                title: 'Pagamentos Processados!',
                description: `${selectedPayments.length} pagamento(s) marcado(s) como pago(s).`
            });
            
            // Limpar seleção e atualizar dados
            setSelectedPayments([]);
            if (user) {
                refreshWithDelay(() => fetchData(user.uid));
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
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nova Entrega</CardTitle>
                    <CardDescription>Preencha os detalhes da entrega. Isso irá gerar uma nova transação de receita.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DeliveryForm 
                        onFormSubmit={handleAction}
                        recipients={recipients}
                    />
                </CardContent>
            </Card>
            
            <Separator />

            <Separator />

            <Tabs defaultValue="history">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="pending">Entregas Pendentes</TabsTrigger>
                    <TabsTrigger value="history">Histórico de Entregas</TabsTrigger>
                    <TabsTrigger value="to-receive">Entregas a Receber</TabsTrigger>
                    <TabsTrigger value="routes">Gerenciamento de Rotas</TabsTrigger>
                </TabsList>
                 <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Entregas Pendentes</CardTitle>
                            <CardDescription>Novas solicitações de entrega para você aceitar ou recusar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <DeliveryHistory 
                                onAction={handleAction} 
                                deliveries={pendingDeliveries} 
                                loading={loading}
                                isHistoryTab={false}
                                onRespond={handleDeliveryRequest}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Histórico de Entregas</CardTitle>
                                    <CardDescription>
                                        {dateRange?.from ? format(dateRange.from, "PPP", { locale: ptBR }) : ''}
                                        {dateRange?.to ? ` - ${format(dateRange.to, "PPP", { locale: ptBR })}` : ''}
                                    </CardDescription>
                                </div>
                                <DateRangePicker 
                                    date={dateRange} 
                                    onDateChange={setDateRange} 
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
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
                     <Card>
                        <CardHeader>
                            <CardTitle>Entregas a Receber</CardTitle>
                            <CardDescription>Entregas que foram finalizadas mas ainda não foram pagas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Controles de multi-seleção */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <input 
                                            type="checkbox" 
                                            id="select-all-payments"
                                            className="rounded border-gray-300"
                                            checked={selectedPayments.length === deliveriesToReceive.length && selectedPayments.length > 0}
                                            onChange={(e) => handleSelectAllPayments(e.target.checked)}
                                        />
                                        <label htmlFor="select-all-payments" className="text-sm font-medium">
                                            Selecionar todas as entregas ({selectedPayments.length} selecionadas)
                                        </label>
                                    </div>
                                    <Button 
                                        variant="default" 
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={handleProcessPayments}
                                        disabled={isProcessingPayments || selectedPayments.length === 0}
                                    >
                                        {isProcessingPayments ? '🔄 Processando...' : '💰 Dar Baixa nos Pagamentos'}
                                    </Button>
                                </div>
                                
                                {/* Lista de entregas com checkboxes */}
                                <div className="grid gap-4">
                                    {deliveriesToReceive.map((delivery) => (
                                        <div key={delivery.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex items-start space-x-3">
                                                <input 
                                                    type="checkbox" 
                                                    id={`payment-${delivery.id}`}
                                                    className="mt-1 rounded border-gray-300"
                                                    checked={selectedPayments.includes(delivery.id)}
                                                    onChange={(e) => handleSelectPayment(delivery.id, e.target.checked)}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-medium text-gray-900">
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
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        📍 {delivery.recipientAddress?.street && delivery.recipientAddress?.number 
                                                            ? `${delivery.recipientAddress.street}, ${delivery.recipientAddress.number}, ${delivery.recipientAddress.neighborhood}, ${delivery.recipientAddress.city}, ${delivery.recipientAddress.state}`
                                                            : 'Endereço não informado'
                                                        }
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        📅 {delivery.date.toDate().toLocaleDateString('pt-BR')}
                                                    </p>
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
                <TabsContent value="routes">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gerenciamento de Rotas</CardTitle>
                            <CardDescription>Selecione múltiplas entregas para otimizar sua rota e economizar tempo e combustível.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
