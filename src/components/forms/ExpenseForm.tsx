
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
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
import { getUserVehicles, type VehicleInfo } from '@/services/vehicle';
import { auth } from '@/lib/firebase';
import { CalendarIcon } from 'lucide-react';
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
import { DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';

const expenseSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  category: z.string({ required_error: 'A categoria é obrigatória.' }),
  observations: z.string().optional(),
  km: z.coerce.number().optional(),
  pricePerLiter: z.coerce.number().optional(),
  vehicleId: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const expenseCategories = [
    "Combustível",
    "Manutenção",
    "Alimentação",
    "Limpeza",
    "Seguro",
    "Impostos",
    "Multas",
    "Outros",
]

interface ExpenseFormProps {
    onFormSubmit: () => void;
    transactionToEdit?: Transaction | null;
}

export function ExpenseForm({ onFormSubmit, transactionToEdit }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
        description: '',
        amount: '' as unknown as number, // Começa vazio
        date: new Date(),
        category: '',
        observations: '',
        km: undefined,
        pricePerLiter: undefined,
        vehicleId: undefined,
    },
  });

  const categoryWatcher = form.watch("category");

  // Carregar dados dos veículos
  useEffect(() => {
    const loadVehicles = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const vehiclesData = await getUserVehicles(user.uid);
          setVehicles(vehiclesData);
        } catch (error) {
          console.error('Erro ao carregar veículos:', error);
        }
      }
    };
    loadVehicles();
  }, []);

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        description: transactionToEdit.description,
        amount: transactionToEdit.amount,
        date: transactionToEdit.date.toDate(),
        category: transactionToEdit.category,
        observations: transactionToEdit.observations || '',
        km: transactionToEdit.km,
        pricePerLiter: transactionToEdit.pricePerLiter,
      });
    } else {
        form.reset({
            description: '',
            amount: '' as unknown as number,
            date: new Date(),
            category: '',
            observations: '',
            km: undefined,
            pricePerLiter: undefined,
            vehicleId: undefined,
        });
    }
  }, [transactionToEdit, form]);

  async function onSubmit(values: ExpenseFormValues) {
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
        const dataToSave: Partial<TransactionInput> = {
            ...values,
            observations: values.observations || '',
        };

        if (categoryWatcher !== 'Combustível') {
            delete dataToSave.pricePerLiter;
        }

        if (categoryWatcher !== 'Combustível' && categoryWatcher !== 'Manutenção') {
            delete dataToSave.km;
        }
        
        if(transactionToEdit) {
            await updateTransaction(transactionToEdit.id, dataToSave);
            toast({
                title: 'Sucesso!',
                description: 'Despesa atualizada.',
            });
        } else {
            const transactionData: TransactionInput = {
                userId: user.uid,
                type: 'despesa',
                description: dataToSave.description || '',
                amount: dataToSave.amount || 0,
                category: dataToSave.category || '',
                date: dataToSave.date || new Date(),
                ...dataToSave,
            };
            console.log('💾 ExpenseForm: Salvando nova despesa:', transactionData);
            await addTransaction(transactionData);
            console.log('✅ ExpenseForm: Despesa salva com sucesso!');
            toast({
                title: 'Sucesso!',
                description: 'Despesa adicionada.',
            });
        }
      form.reset();
      onFormSubmit();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar despesa',
        description: 'Ocorreu um problema ao salvar os dados. Tente novamente.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                <Input placeholder="Ex: Gasolina" {...field} />
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
                <FormLabel>Valor</FormLabel>
                <FormControl>
                <Input type="number" step="0.01" placeholder="0,00" {...field} />
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
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {expenseCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        
        {categoryWatcher === 'Combustível' && (
            <>
                {vehicles.length > 0 ? (
                    <FormField
                        control={form.control}
                        name="vehicleId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Veículo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione o veículo" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {vehicles.map((vehicle) => (
                                    <SelectItem key={vehicle.id} value={vehicle.id || ''}>
                                        {vehicle.brand} {vehicle.model} {vehicle.year} - {vehicle.plate}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                            ⚠️ Nenhum veículo cadastrado. Cadastre um veículo primeiro para registrar gastos com combustível.
                        </p>
                    </div>
                )}
            </>
        )}
        
        {(categoryWatcher === 'Combustível' || categoryWatcher === 'Manutenção') && (
            <FormField
                control={form.control}
                name="km"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>KM do Veículo</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="Ex: 120000" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        {categoryWatcher === 'Combustível' && (
            <FormField
                control={form.control}
                name="pricePerLiter"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Valor por Litro</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.001" placeholder="5,50" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}


        <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>Data da Despesa</FormLabel>
                <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                    <Button
                        variant={'outline'}
                        className={cn(
                        'w-full pl-3 text-left font-normal',
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
                <PopoverContent className="w-auto p-0" align="start">
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
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Adicione uma observação (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
        </DialogFooter>
        </form>
    </Form>
  );
}
