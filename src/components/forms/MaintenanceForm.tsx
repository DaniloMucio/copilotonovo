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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {maintenanceToEdit ? 'Editar Manutenção' : 'Nova Manutenção'}
          </DialogTitle>
          <DialogDescription>
            {maintenanceToEdit 
              ? 'Altere os detalhes da manutenção.' 
              : 'Registre uma nova manutenção do veículo.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id!}>
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
                    <FormLabel>Tipo de Manutenção</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maintenanceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
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
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Troca de óleo do motor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Manutenção</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
                      <PopoverContent className="w-auto p-0" align="start">
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
                    <FormLabel>Próxima Manutenção</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
                      <PopoverContent className="w-auto p-0" align="start">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
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
                    <FormLabel>Quilometragem Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nextKm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima Quilometragem</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="workshop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oficina</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da oficina" {...field} />
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
                    <FormLabel>Mecânico</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do mecânico" {...field} />
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
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre a manutenção..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : maintenanceToEdit ? 'Atualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
