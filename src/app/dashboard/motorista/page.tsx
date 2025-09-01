
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
import { getTransactions, type Transaction } from '@/services/transactions';
import { getShifts, type WorkShift } from '@/services/workShifts';
import { DollarSign, TrendingDown, TrendingUp, Pencil as PencilIcon, KeyRound } from 'lucide-react';
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
import { ProfileForm } from '@/components/forms/ProfileForm';
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';
import { ReportsManager } from '@/components/ReportsManager';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { usePWAInstall } from '@/hooks/use-pwa-install';

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
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // PWA hook
  const { canInstall: pwaCanInstall, installApp: pwaInstall } = usePWAInstall();

  const defaultTab = searchParams.get('tab') || 'overview';
  
  const fetchUserData = useCallback(async (uid: string) => {
    const data = await getUserDocument(uid);
    if (data) setUserData(data);
  }, []);

  const fetchTransactions = useCallback(async (uid: string) => {
    const userTransactions = await getTransactions(uid);
    setTransactions(userTransactions);
  }, []);

  const fetchShifts = useCallback(async (uid: string) => {
    const userShifts = await getShifts(uid);
    setShifts(userShifts);
  }, []);

  const refreshAllData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserData(uid),
        fetchTransactions(uid),
        fetchShifts(uid),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar todas as informações do dashboard."
      })
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, fetchTransactions, fetchShifts, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await refreshAllData(currentUser.uid);
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router, refreshAllData]);

  const onTransactionAddedOrUpdated = () => {
    if (user) fetchTransactions(user.uid);
    setIsEditDialogOpen(false);
    setTransactionToEdit(null);
  }

  const handleProfileUpdate = () => {
    if(user) {
      const refreshedUser = auth.currentUser;
      if(refreshedUser) setUser(refreshedUser);
      fetchUserData(user.uid);
    }
    setIsProfileDialogOpen(false);
  }

  const handlePasswordUpdate = () => {
    setIsPasswordDialogOpen(false);
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
      fetchTransactions(user.uid);
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
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-3/4" /></CardContent>
            </Card>
          ))}
        </div>
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Transações Recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Co-Piloto</h1>
          <p className="text-muted-foreground">Sua visão geral financeira, {user.displayName?.split(' ')[0]}.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {userData && (<Badge variant="outline" className="text-sm font-medium capitalize">Perfil: {userData.userType}</Badge>)}
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="icon"><PencilIcon className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Editar Perfil</DialogTitle><DialogDescription>Altere suas informações de perfil.</DialogDescription></DialogHeader>
                {user && userData && <ProfileForm user={user} userData={userData} onFormSubmit={handleProfileUpdate} />}
              </DialogContent>
            </Dialog>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="icon"><KeyRound className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Alterar Senha</DialogTitle><DialogDescription>Defina uma nova senha para sua conta.</DialogDescription></DialogHeader>
                <ChangePasswordForm onFormSubmit={handlePasswordUpdate} />
              </DialogContent>
            </Dialog>
            <PWAInstallButton canInstall={pwaCanInstall} install={pwaInstall} />
          </div>
        </div>
      </div>
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-sm border-emerald-200 bg-emerald-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-800">Receita Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {currentMonthIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Mês atual</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-rose-200 bg-rose-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-rose-800">Despesa Total</CardTitle>
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-rose-600">
                    {currentMonthExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Mês atual</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-stone-200 bg-stone-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${currentMonthNetBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currentMonthNetBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Mês atual</p>
                </CardContent>
              </Card>
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
                            <TableCell><Badge variant={transaction.type === 'receita' ? 'default' : 'destructive'} className={transaction.type === 'receita' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>{transaction.type}</Badge></TableCell>
                            <TableCell><Badge variant="outline">{transaction.category}</Badge></TableCell>
                            <TableCell>{transaction.observations}</TableCell>
                            <TableCell className={`text-right font-medium ${transaction.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>{transaction.type === 'despesa' && '- '}{transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
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
        <TabsContent value="receitas"><IncomeManager user={user} transactions={incomeTransactions} onAction={() => fetchTransactions(user.uid)} /></TabsContent>
        <TabsContent value="despesas"><ExpenseManager user={user} transactions={expenseTransactions} onAction={() => fetchTransactions(user.uid)} /></TabsContent>
        <TabsContent value="reports"><ReportsManager transactions={transactions} shifts={shifts} user={user} /></TabsContent>
      </Tabs>
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
