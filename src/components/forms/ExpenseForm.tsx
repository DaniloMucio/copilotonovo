
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
            <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Descrição da Despesa
                </FormLabel>
                <FormControl>
                <Input 
                    placeholder="Ex: Gasolina" 
                    className="h-12 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl text-base transition-all duration-300"
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
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Valor da Despesa
                </FormLabel>
                <FormControl>
                <div className="relative">
                    <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
                        className="h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl text-base transition-all duration-300"
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
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Categoria
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl text-base transition-all duration-300">
                    <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-xl border-0 shadow-xl bg-white border border-gray-200">
                    {expenseCategories.map(cat => (
                        <SelectItem key={cat} value={cat} className="rounded-lg hover:bg-gray-50">{cat}</SelectItem>
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
                            <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                Veículo
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl text-base transition-all duration-300">
                                <SelectValue placeholder="Selecione o veículo" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-0 shadow-xl bg-white border border-gray-200">
                                {vehicles.map((vehicle) => (
                                    <SelectItem key={vehicle.id} value={vehicle.id || ''} className="rounded-lg hover:bg-gray-50">
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
                    <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                        <p className="text-sm text-yellow-800 font-medium">
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
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        KM do Veículo
                    </FormLabel>
                    <FormControl>
                    <div className="relative">
                        <Input 
                            type="number" 
                            placeholder="Ex: 120000" 
                            className="h-12 pr-12 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl text-base transition-all duration-300"
                            {...field} 
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                            KM
                        </div>
                    </div>
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
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        Valor por Litro
                    </FormLabel>
                    <FormControl>
                    <div className="relative">
                        <Input 
                            type="number" 
                            step="0.001" 
                            placeholder="5,50" 
                            className="h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl text-base transition-all duration-300"
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
        )}


        <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Data da Despesa
                </FormLabel>
                <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                    <Button
                        variant={'outline'}
                        className={cn(
                        'w-full h-12 pl-3 text-left font-normal border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl transition-all duration-300',
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
                  placeholder="Adicione uma observação sobre esta despesa..." 
                  className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl transition-all duration-300"
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
            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium py-3"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                Salvar Despesa
              </div>
            )}
          </Button>
        </div>
        </form>
    </Form>
  );
}
