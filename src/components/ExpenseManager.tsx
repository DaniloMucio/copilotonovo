
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
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { Transaction, deleteTransaction } from '@/services/transactions';
import type { User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface ExpenseManagerProps {
  user: User;
  transactions: Transaction[];
  onAction: () => void;
}

export function ExpenseManager({ user, transactions, onAction }: ExpenseManagerProps) {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = () => {
    onAction(); 
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
            description: "Despesa excluída."
        });
        onAction();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Ocorreu um problema ao excluir a despesa."
        })
    }
  }

  const totalExpenses = transactions.reduce((acc, curr) => acc + curr.amount, 0);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
        <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Despesa</DialogTitle>
              <DialogDescription>
                Preencha os dados da sua nova despesa.
              </DialogDescription>
            </DialogHeader>
            <ExpenseForm onFormSubmit={handleFormSubmit} />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Total de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">
            {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
             <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>KM do Veículo</TableHead>
                  <TableHead>Valor p/ Litro</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Data</TableHead>
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
                    <TableCell>
                        {transaction.km ? `${transaction.km.toLocaleString('pt-BR')} km` : 'N/A'}
                    </TableCell>
                    <TableCell>
                        {transaction.pricePerLiter ? transaction.pricePerLiter.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      - {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell>
                      {format(transaction.date.toDate(), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Dialog open={isEditFormOpen && transactionToEdit?.id === transaction.id} onOpenChange={(isOpen) => {
                            setIsEditFormOpen(isOpen)
                            if (!isOpen) {
                                setTransactionToEdit(null);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(transaction)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Editar Despesa</DialogTitle>
                                    <DialogDescription>Altere os dados da sua despesa.</DialogDescription>
                                </DialogHeader>
                                <ExpenseForm onFormSubmit={handleFormSubmit} transactionToEdit={transactionToEdit} />
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
            <p className="text-muted-foreground text-center py-4">Nenhuma despesa registrada ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
