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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addMaintenance, updateMaintenance, type MaintenanceItem } from '@/services/vehicle';
import { getUserVehicles, type VehicleInfo } from '@/services/vehicle';
import { useAuth } from '@/context/AuthContext';
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
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Selecione um veículo.'),
  type: z.enum(['oil', 'tire', 'brake', 'filter', 'battery', 'coolant', 'other'], {
    required_error: 'Selecione o tipo de manutenção.',
  }),
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  cost: z.coerce.number().positive('O valor deve ser positivo.'),
  km: z.coerce.number().positive('A quilometragem deve ser positiva.'),
  nextDate: z.date({ required_error: 'A próxima data é obrigatória.' }),
  nextKm: z.coerce.number().positive('A próxima quilometragem deve ser positiva.'),
  workshop: z.string().optional(),
  mechanic: z.string().optional(),
  notes: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

const maintenanceTypes = [
  { value: 'oil', label: 'Óleo' },
  { value: 'tire', label: 'Pneus' },
  { value: 'brake', label: 'Freios' },
  { value: 'filter', label: 'Filtros' },
  { value: 'battery', label: 'Bateria' },
  { value: 'coolant', label: 'Refrigerante' },
  { value: 'other', label: 'Outros' },
];

interface MaintenanceFormProps {
  isOpen: boolean;
  maintenanceToEdit?: MaintenanceItem | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MaintenanceForm({ isOpen, maintenanceToEdit, onSuccess, onCancel }: MaintenanceFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicleId: '',
      type: 'oil',
      description: '',
      date: new Date(),
      cost: 0,
      km: 0,
      nextDate: new Date(),
      nextKm: 0,
      workshop: '',
      mechanic: '',
      notes: '',
    },
  });

  // Carregar veículos
  useEffect(() => {
    const loadVehicles = async () => {
      if (!user?.uid) return;
      
      try {
        const userVehicles = await getUserVehicles(user.uid);
        setVehicles(userVehicles);
      } catch (error) {
        console.error('Erro ao carregar veículos:', error);
      }
    };

    if (isOpen && user?.uid) {
      loadVehicles();
    }
  }, [isOpen, user?.uid]);

  // Preencher formulário quando editando
  useEffect(() => {
    if (maintenanceToEdit) {
      form.reset({
        vehicleId: maintenanceToEdit.vehicleId,
        type: maintenanceToEdit.type,
        description: maintenanceToEdit.description,
        date: maintenanceToEdit.date,
        cost: maintenanceToEdit.cost,
        km: maintenanceToEdit.km,
        nextDate: maintenanceToEdit.nextDate,
        nextKm: maintenanceToEdit.nextKm,
        workshop: maintenanceToEdit.workshop || '',
        mechanic: maintenanceToEdit.mechanic || '',
        notes: maintenanceToEdit.notes || '',
      });
    } else {
      form.reset({
        vehicleId: '',
        type: 'oil',
        description: '',
        date: new Date(),
        cost: 0,
        km: 0,
        nextDate: new Date(),
        nextKm: 0,
        workshop: '',
        mechanic: '',
        notes: '',
      });
    }
  }, [maintenanceToEdit, form]);

  async function onSubmit(values: MaintenanceFormValues) {
    if (!user?.uid) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const maintenanceData = {
        ...values,
        userId: user.uid,
      };

      if (maintenanceToEdit) {
        await updateMaintenance(maintenanceToEdit.id!, maintenanceData);
        toast({
          title: 'Manutenção atualizada!',
          description: 'A manutenção foi atualizada com sucesso.',
        });
      } else {
        await addMaintenance(maintenanceData);
        toast({
          title: 'Manutenção registrada!',
          description: 'A nova manutenção foi registrada com sucesso.',
        });
      }

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error);
      toast({
        title: 'Erro ao salvar manutenção',
        description: 'Ocorreu um erro ao salvar a manutenção. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="relative bg-gradient-to-br from-orange-600 via-red-600 to-orange-800 p-8 text-white rounded-t-3xl overflow-hidden">
          <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">🔧</span>
          </div>
          <div className="relative z-10">
            <DialogTitle className="text-3xl font-bold mb-2">
              {maintenanceToEdit ? 'Editar Manutenção' : 'Nova Manutenção'}
            </DialogTitle>
            <DialogDescription className="text-orange-100 text-lg">
              {maintenanceToEdit 
                ? 'Altere os detalhes da manutenção.' 
                : 'Registre uma nova manutenção do veículo.'
              }
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-6">
            {/* Informações Básicas */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Veículo *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300">
                            <SelectValue placeholder="Selecione o veículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-0 shadow-xl bg-white border border-gray-200">
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id!} className="rounded-lg hover:bg-gray-50">
                              {vehicle.brand} {vehicle.model} - {vehicle.plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Tipo de Manutenção *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-0 shadow-xl bg-white border border-gray-200">
                          {maintenanceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="rounded-lg hover:bg-gray-50">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Descrição *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Troca de óleo do motor" 
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datas e Valores */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                Datas e Valores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Data da Manutenção *
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-12 pl-3 text-left font-normal border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-300",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
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
                              date > new Date() || date < new Date("1900-01-01")
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
                  name="nextDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Próxima Manutenção *
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-12 pl-3 text-left font-normal border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-300",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
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
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Custo (R$) *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base transition-all duration-300"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
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
                  name="km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Quilometragem Atual *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base transition-all duration-300"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                            KM
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Próxima Quilometragem *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base transition-all duration-300"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                            KM
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-2xl border border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                Informações Adicionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="workshop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Oficina
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome da oficina" 
                          className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl text-base transition-all duration-300"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mechanic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Mecânico
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome do mecânico" 
                          className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl text-base transition-all duration-300"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Observações
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre a manutenção..."
                        className="resize-none border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl transition-all duration-300"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botões de ação */}
            <div className="bg-gray-50/50 border-t border-gray-100 p-6 -m-6 mt-8">
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-medium"
                  onClick={onCancel}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="mr-2">🔧</span>
                      {maintenanceToEdit ? 'Atualizar Manutenção' : 'Registrar Manutenção'}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}