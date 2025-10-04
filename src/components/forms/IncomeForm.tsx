
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, updateTransaction, type Transaction, type TransactionInput } from '@/services/transactions';
import { auth } from '@/lib/firebase';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Textarea } from '../ui/textarea';

const incomeSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  category: z.string({ required_error: 'A categoria é obrigatória.' }),
  observations: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

const incomeCategories = [
    "Corrida (App)",
    "Corrida (Particular)",
    "Entrega",
    "Bonificação",
    "Outros",
]

interface IncomeFormProps {
    onFormSubmit: () => void;
    transactionToEdit?: Transaction | null;
    onSuccess?: () => void; // Callback padronizado para sucesso
}

export function IncomeForm({ onFormSubmit, transactionToEdit, onSuccess }: IncomeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
        description: '',
        amount: '' as unknown as number, // Começa vazio
        date: new Date(),
        category: '',
        observations: '',
    },
  });

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        description: transactionToEdit.description,
        amount: transactionToEdit.amount,
        date: transactionToEdit.date.toDate(),
        category: transactionToEdit.category,
        observations: transactionToEdit.observations || '',
      });
    } else {
        form.reset({
            description: '',
            amount: '' as unknown as number,
            date: new Date(),
            category: '',
            observations: '',
        });
    }
  }, [transactionToEdit, form]);

  async function onSubmit(values: IncomeFormValues) {
    const user = auth.currentUser;
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para realizar esta ação.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
        const dataToSave = {
            ...values,
            observations: values.observations || '',
        }

        if(transactionToEdit) {
            await updateTransaction(transactionToEdit.id, dataToSave);
            toast({
                title: 'Sucesso!',
                description: 'Receita atualizada.',
            });
        } else {
            const transactionData: TransactionInput = {
                userId: user.uid,
                type: 'receita',
                ...dataToSave,
            };
            await addTransaction(transactionData);
            toast({
                title: 'Sucesso!',
                description: 'Receita adicionada.',
            });
        }
      form.reset();
      onFormSubmit();
      
      // Callback de sucesso para auto-refresh
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar receita',
        description: 'Ocorreu um problema ao salvar os dados. Tente novamente.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Descrição da Receita
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Corrida para o centro" 
                  className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base transition-all duration-300"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Valor da Receita
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00" 
                    className="h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base transition-all duration-300"
                    {...field} 
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg font-medium">
                    R$
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Categoria
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base transition-all duration-300">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl border-0 shadow-xl bg-white border border-gray-200">
                  {incomeCategories.map(cat => (
                      <SelectItem key={cat} value={cat} className="rounded-lg hover:bg-gray-50">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Data da Receita
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full h-12 pl-3 text-left font-normal border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-300',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border-0 shadow-xl bg-white border border-gray-200" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                Observações (Opcional)
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Adicione uma observação sobre esta receita..." 
                  className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-300"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-medium py-3"
            onClick={() => form.reset()}
          >
            Limpar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium py-3"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                Salvar Receita
              </div>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
