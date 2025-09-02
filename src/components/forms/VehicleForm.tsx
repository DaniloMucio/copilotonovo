'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

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
import { saveVehicleInfo, updateVehicleInfo, type VehicleInfo } from '@/services/vehicle';
import { useAuth } from '@/context/AuthContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const vehicleFormSchema = z.object({
  brand: z.string().min(2, 'A marca deve ter pelo menos 2 caracteres.'),
  model: z.string().min(2, 'O modelo deve ter pelo menos 2 caracteres.'),
  year: z.coerce.number().min(1900, 'Ano inválido.').max(new Date().getFullYear() + 1, 'Ano não pode ser futuro.'),
  plate: z.string().min(6, 'Placa deve ter pelo menos 6 caracteres.').max(8, 'Placa deve ter no máximo 8 caracteres.'),
  currentKm: z.coerce.number().min(0, 'KM deve ser positivo.'),
  fuelTank: z.coerce.number().min(1, 'Capacidade do tanque deve ser maior que 0.'),
  averageConsumption: z.coerce.number().min(0.1, 'Consumo médio deve ser maior que 0.'),
  color: z.string().optional(),
  vin: z.string().optional(),
  insuranceCompany: z.string().optional(),
  insurancePolicy: z.string().optional(),
  insuranceExpiry: z.date().optional(),
  registrationNumber: z.string().optional(),
  registrationExpiry: z.date().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  vehicleToEdit?: VehicleInfo | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

export function VehicleForm({ vehicleToEdit, onSuccess, onCancel, isOpen }: VehicleFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      currentKm: 0,
      fuelTank: 50,
      averageConsumption: 12,
      color: '',
      vin: '',
      insuranceCompany: '',
      insurancePolicy: '',
      insuranceExpiry: undefined,
      registrationNumber: '',
      registrationExpiry: undefined,
    },
  });

  useEffect(() => {
    if (vehicleToEdit) {
      form.reset({
        brand: vehicleToEdit.brand,
        model: vehicleToEdit.model,
        year: vehicleToEdit.year,
        plate: vehicleToEdit.plate,
        currentKm: vehicleToEdit.currentKm,
        fuelTank: vehicleToEdit.fuelTank,
        averageConsumption: vehicleToEdit.averageConsumption,
        color: vehicleToEdit.color || '',
        vin: vehicleToEdit.vin || '',
        insuranceCompany: vehicleToEdit.insurance?.company || '',
        insurancePolicy: vehicleToEdit.insurance?.policy || '',
        insuranceExpiry: vehicleToEdit.insurance?.expiry || undefined,
        registrationNumber: vehicleToEdit.registration?.number || '',
        registrationExpiry: vehicleToEdit.registration?.expiry || undefined,
      });
    } else {
      form.reset({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        plate: '',
        currentKm: 0,
        fuelTank: 50,
        averageConsumption: 12,
        color: '',
        vin: '',
        insuranceCompany: '',
        insurancePolicy: '',
        insuranceExpiry: undefined,
        registrationNumber: '',
        registrationExpiry: undefined,
      });
    }
  }, [vehicleToEdit, form]);

  async function onSubmit(values: VehicleFormValues) {
    if (!user?.uid) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const vehicleData = {
        userId: user.uid,
        brand: values.brand,
        model: values.model,
        year: values.year,
        plate: values.plate.toUpperCase(),
        currentKm: values.currentKm,
        fuelTank: values.fuelTank,
        averageConsumption: values.averageConsumption,
        ...(values.color && { color: values.color }),
        ...(values.vin && { vin: values.vin }),
        ...(values.insuranceCompany && values.insurancePolicy && values.insuranceExpiry && {
          insurance: {
            company: values.insuranceCompany,
            policy: values.insurancePolicy,
            expiry: values.insuranceExpiry,
          }
        }),
        ...(values.registrationNumber && values.registrationExpiry && {
          registration: {
            number: values.registrationNumber,
            expiry: values.registrationExpiry,
          }
        }),
      };

      if (vehicleToEdit?.id) {
        // Atualizar veículo existente
        await updateVehicleInfo(vehicleToEdit.id, vehicleData);
      } else {
        // Criar novo veículo
        await saveVehicleInfo(vehicleData);
      }

      toast({
        title: 'Sucesso',
        description: vehicleToEdit 
          ? 'Informações do veículo atualizadas com sucesso!' 
          : 'Veículo cadastrado com sucesso!',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar informações do veículo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicleToEdit ? 'Editar Veículo' : 'Cadastrar Veículo'}
          </DialogTitle>
          <DialogDescription>
            {vehicleToEdit 
              ? 'Atualize as informações do seu veículo.' 
              : 'Cadastre as informações do seu veículo para melhor controle.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Corolla" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2020" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Atual *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuelTank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade do Tanque (L) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="averageConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumo Médio (km/L) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="12.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Prata" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Chassi (VIN)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1HGBH41JXMN109186" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Seguro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="insuranceCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seguradora</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Porto Seguro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insurancePolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Apólice</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: PS-123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insuranceExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
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
                              date < new Date()
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
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documentação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Documento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: REG-789012" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
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
                              date < new Date()
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
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : (vehicleToEdit ? 'Atualizar' : 'Cadastrar')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
