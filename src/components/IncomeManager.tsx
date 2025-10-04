
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IncomeForm } from '@/components/forms/IncomeForm';
import { Transaction, deleteTransaction } from '@/services/transactions';
import type { User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useDashboardRefresh } from '@/hooks/use-unified-refresh';


interface IncomeManagerProps {
  user: User;
  transactions: Transaction[];
  onAction: () => void;
}

export function IncomeManager({ user, transactions, onAction }: IncomeManagerProps) {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const { refreshTransactions } = useDashboardRefresh();

  const handleFormSubmit = () => {
    // Usar refresh padronizado
    refreshTransactions(async () => {
      onAction();
    });
    setIsAddFormOpen(false); 
    setIsEditFormOpen(false);
    setTransactionToEdit(null);
  };

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsEditFormOpen(true);
  };

  const handleAddClick = () => {
    setTransactionToEdit(null);
    setIsAddFormOpen(true);
  }

  const handleDelete = async (transactionId: string) => {
    try {
        await deleteTransaction(transactionId);
        toast({
            title: "Sucesso!",
            description: "Receita excluída."
        });
        // Usar refresh padronizado
        refreshTransactions(async () => {
            onAction();
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Ocorreu um problema ao excluir a receita."
        })
    }
  }

  const totalIncome = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Receitas</h1>
        <div className="flex gap-2">
            <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                <DialogTrigger asChild>
                    <Button 
                        onClick={handleAddClick}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Receita
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl max-w-lg mx-4 overflow-hidden">
                    {/* Header com gradiente e ícone */}
                    <DialogHeader className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-green-800 p-8 text-white">
                        <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <PlusCircle className="h-8 w-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold mb-2">Adicionar Receita</DialogTitle>
                        <DialogDescription className="text-green-100 text-base leading-relaxed">
                            Preencha os dados da sua nova receita para registrar seus ganhos.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Conteúdo do formulário */}
                    <div className="p-6">
                        <IncomeForm 
                          onFormSubmit={handleFormSubmit} 
                          onSuccess={() => {
                            // Auto-refresh após criação
                            refreshTransactions(async () => {
            onAction();
        });
                          }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">
            {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-green-500">
                      {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-right">
                      {format(transaction.date.toDate(), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Dialog open={isEditFormOpen && transactionToEdit?.id === transaction.id} onOpenChange={(isOpen) => {
                            setIsEditFormOpen(isOpen);
                            if (!isOpen) {
                                setTransactionToEdit(null);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(transaction)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                             <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                <DialogTitle>Editar Receita</DialogTitle>
                                <DialogDescription>
                                Altere os dados da sua receita.
                                </DialogDescription>
                                </DialogHeader>
                                <IncomeForm 
                                  onFormSubmit={handleFormSubmit} 
                                  transactionToEdit={transactionToEdit}
                                  onSuccess={() => {
                                    // Auto-refresh após edição
                                    refreshTransactions(async () => {
            onAction();
        });
                                  }}
                                />
                            </DialogContent>
                        </Dialog>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente a
                                    transação.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(transaction.id)}>
                                    Excluir
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma receita registrada ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
