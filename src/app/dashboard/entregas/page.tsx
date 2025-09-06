
'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { DeliveryForm } from '@/components/forms/DeliveryForm';
import { DeliveryHistory } from '@/components/DeliveryHistory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getTransactions, type Transaction, updateTransaction } from '@/services/transactions';
import { getRecipientsByUser, type Recipient } from '@/services/recipients';
import { useToast } from '@/hooks/use-toast';
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
    
    // Estado para o seletor de data - padrão: mês atual
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

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
    }, [toast]);

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
            fetchData(user!.uid);
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
           await fetchData(user.uid);
        }
    }, [user, fetchData]);

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
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Entregas Pendentes</TabsTrigger>
                    <TabsTrigger value="history">Histórico de Entregas</TabsTrigger>
                    <TabsTrigger value="to-receive">Entregas a Receber</TabsTrigger>
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
                            <DeliveryHistory 
                                onAction={handleAction} 
                                deliveries={deliveriesToReceive} 
                                loading={loading}
                                isHistoryTab={false}
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
