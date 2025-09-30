
'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from '@/lib/firebase';
import { getCurrentMonthTransactionsSync, getTransactions, type Transaction } from '@/services/transactions';
import { getShifts, type WorkShift } from '@/services/workShifts';
import { DollarSign, TrendingDown, TrendingUp, Calendar, Car, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ExpenseManager } from '@/components/ExpenseManager';
import { IncomeManager } from '@/components/IncomeManager';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { deleteTransaction } from '@/services/transactions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { IncomeForm } from '@/components/forms/IncomeForm';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { getUserDocument, type UserData } from '@/services/firestore';
import { ReportsManager } from '@/components/ReportsManager';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';


interface MotoristaDashboardProps {
  canInstall?: boolean;
  install?: () => void;
}

function MotoristaDashboard({ canInstall = false, install = () => {} }: MotoristaDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // PWA hook
  const { canInstall: pwaCanInstall, installApp: pwaInstall } = usePWAInstall();
  
  // Auto refresh hook
  const { refreshData, refreshWithDelay } = useAutoRefresh();

  const defaultTab = searchParams.get('tab') || 'overview';
  
  const fetchUserData = useCallback(async (uid: string) => {
    const data = await getUserDocument(uid);
    if (data) setUserData(data);
  }, []);

  const fetchTransactions = useCallback(async (uid: string) => {
    console.log('🔄 MotoristaDashboard: fetchTransactions iniciado para uid:', uid);
    const userTransactions = await getCurrentMonthTransactionsSync(uid);
    console.log('📊 MotoristaDashboard: Transações carregadas:', userTransactions.length);
    setTransactions(userTransactions);
    console.log('✅ MotoristaDashboard: fetchTransactions concluído');
  }, []);

  const fetchAllTransactions = useCallback(async (uid: string) => {
    const allUserTransactions = await getTransactions(uid);
    setAllTransactions(allUserTransactions);
  }, []);

  const fetchShifts = useCallback(async (uid: string) => {
    const userShifts = await getShifts(uid);
    setShifts(userShifts);
  }, []);

  const refreshAllData = useCallback(async (uid: string) => {
    console.log('🔄 MotoristaDashboard: refreshAllData iniciado para uid:', uid);
    setLoading(true);
    try {
      await Promise.all([
        fetchUserData(uid),
        fetchTransactions(uid),
        fetchAllTransactions(uid),
        fetchShifts(uid),
      ]);
      console.log('✅ MotoristaDashboard: refreshAllData concluído com sucesso');
    } catch (error) {
      console.error("❌ MotoristaDashboard: Erro ao carregar dados do dashboard:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar todas as informações do dashboard."
      })
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, fetchTransactions, fetchAllTransactions, fetchShifts, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await refreshAllData(currentUser.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router, refreshAllData]);

  const onTransactionAddedOrUpdated = () => {
    console.log('🔄 MotoristaDashboard: onTransactionAddedOrUpdated chamado');
    if (user) {
      console.log('🔄 MotoristaDashboard: Chamando refreshWithDelay...');
      refreshWithDelay(() => refreshAllData(user.uid));
    }
    setIsEditDialogOpen(false);
    setTransactionToEdit(null);
  }


  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsEditDialogOpen(true);
  }

  const handleDelete = async (transactionId: string) => {
    if(!user) return;
    try {
      await deleteTransaction(transactionId);
      toast({ title: "Sucesso!", description: "Transação excluída." });
      refreshWithDelay(() => refreshAllData(user.uid));
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um problema ao excluir a transação." });
    }
  }

  const getCurrentMonthInterval = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: startOfMonth, end: endOfMonth };
  };

  const incomeTransactions = transactions.filter((t) => t.type === 'receita');
  const expenseTransactions = transactions.filter((t) => t.type === 'despesa');
  const totalIncome = incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  const recentTransactions = transactions.slice(0, 5);
  
  // Debug: Log quando transactions muda
  console.log('📊 MotoristaDashboard: transactions atualizado:', {
    total: transactions.length,
    receitas: incomeTransactions.length,
    despesas: expenseTransactions.length,
    recentes: recentTransactions.length
  });

  const currentMonthIncome = incomeTransactions.filter(
    (t) => {
      const transactionDate = t.date.toDate();
      const { start, end } = getCurrentMonthInterval();
      return transactionDate >= start && transactionDate <= end;
    }
  ).reduce((acc, curr) => acc + curr.amount, 0);

  const currentMonthExpenses = expenseTransactions.filter(
    (t) => {
      const transactionDate = t.date.toDate();
      const { start, end } = getCurrentMonthInterval();
      return transactionDate >= start && transactionDate <= end;
    }
  ).reduce((acc, curr) => acc + curr.amount, 0);

  const currentMonthNetBalance = currentMonthIncome - currentMonthExpenses;

  if (loading || !user) {
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
              <Car className="h-4 w-4 text-white" />
            </motion.div>
            <Skeleton className="h-8 w-1/2" />
          </div>
          <Skeleton className="h-4 w-24" />
        </motion.div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span>Transações Recentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + 0.1 * i }}
                  >
                    <Skeleton className="h-10 w-full" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }
  
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
            <Car className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Co-Piloto Driver</h1>
            <p className="text-gray-600">Sua visão geral financeira, {user.displayName?.split(' ')[0]}.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {userData && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Badge variant="outline" className="text-sm font-medium capitalize border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-300">
                  <Zap className="h-3 w-3 mr-1" />
                  Perfil: {userData.userType}
                </Badge>
              </motion.div>
            )}
            <PWAInstallButton canInstall={pwaCanInstall} install={pwaInstall} />
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/90 backdrop-blur-sm border-0 rounded-xl shadow-lg p-1 mobile-tabs">
            <TabsTrigger 
              value="overview" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 mobile-tab"
            >
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="receitas"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 mobile-tab"
            >
              <span className="hidden sm:inline">Receitas</span>
              <span className="sm:hidden">Receitas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="despesas"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 mobile-tab"
            >
              <span className="hidden sm:inline">Despesas</span>
              <span className="sm:hidden">Despesas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 mobile-tab"
            >
              <span className="hidden sm:inline">Relatórios</span>
              <span className="sm:hidden">Relatórios</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-emerald-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-emerald-800 flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Receita Total</span>
                    </CardTitle>
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-emerald-600">
                      {currentMonthIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Mês atual</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 border-l-rose-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-600/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-rose-800 flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4" />
                      <span>Despesa Total</span>
                    </CardTitle>
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <TrendingDown className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-2xl font-bold text-rose-600">
                      {currentMonthExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Mês atual</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className={`shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500 border-l-4 ${currentMonthNetBalance >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${currentMonthNetBalance >= 0 ? 'bg-gradient-to-r from-emerald-600/5 to-green-600/5' : 'bg-gradient-to-r from-rose-600/5 to-red-600/5'}`}></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className={`text-sm font-medium flex items-center space-x-2 ${currentMonthNetBalance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      <DollarSign className="h-4 w-4" />
                      <span>Saldo Líquido</span>
                    </CardTitle>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${currentMonthNetBalance >= 0 ? 'bg-gradient-to-br from-emerald-500 to-green-500' : 'bg-gradient-to-br from-rose-500 to-red-500'}`}>
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className={`text-2xl font-bold ${currentMonthNetBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {currentMonthNetBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Mês atual</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            {/* Indicador do período atual */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Período: {format(getCurrentMonthInterval().start, 'MMMM/yyyy', { locale: ptBR })}
              </div>
            </div>
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Transações Recentes</CardTitle></CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead><TableHead>Observações</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {recentTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.description}</TableCell>
                            <TableCell><Badge variant={transaction.type === 'receita' ? 'default' : 'destructive'} className={transaction.type === 'receita' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'}>{transaction.type}</Badge></TableCell>
                            <TableCell><Badge variant="outline">{transaction.category}</Badge></TableCell>
                            <TableCell>{transaction.observations}</TableCell>
                            <TableCell className={`text-right font-medium ${transaction.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{transaction.type === 'despesa' && '- '}{transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                            <TableCell className="text-right">{format(transaction.date.toDate(), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Dialog open={isEditDialogOpen && transactionToEdit?.id === transaction.id} onOpenChange={(isOpen) => { if (!isOpen) setTransactionToEdit(null); setIsEditDialogOpen(isOpen); }}>
                                <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEditClick(transaction)}><Pencil className="h-4 w-4" /></Button></DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Editar Transação</DialogTitle><DialogDescription>Altere os dados da sua transação.</DialogDescription></DialogHeader>
                                  {transactionToEdit?.type === 'receita' ? <IncomeForm onFormSubmit={onTransactionAddedOrUpdated} transactionToEdit={transactionToEdit} /> : <ExpenseForm onFormSubmit={onTransactionAddedOrUpdated} transactionToEdit={transactionToEdit} />}
                                </DialogContent>
                              </Dialog>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente a transação.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(transaction.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (<p className="text-muted-foreground text-center py-4">Nenhuma transação registrada ainda.</p>)}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="receitas">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Dados do mês atual - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <IncomeManager user={user} transactions={incomeTransactions} onAction={() => refreshWithDelay(() => refreshAllData(user.uid))} />
        </TabsContent>
        <TabsContent value="despesas">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Dados do mês atual - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <ExpenseManager user={user} transactions={expenseTransactions} onAction={() => refreshWithDelay(() => refreshAllData(user.uid))} />
        </TabsContent>
        <TabsContent value="reports"><ReportsManager transactions={allTransactions} shifts={shifts} user={user} /></TabsContent>
      </Tabs>
      </motion.div>
    </div>
  );
}

export default function MotoristaDashboardPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <MotoristaDashboard />
    </Suspense>
  );
}
