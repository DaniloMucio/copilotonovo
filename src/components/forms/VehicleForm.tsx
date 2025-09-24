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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-8 text-white rounded-t-3xl overflow-hidden">
          <div className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">🚗</span>
          </div>
          <div className="relative z-10">
            <DialogTitle className="text-3xl font-bold mb-2">
              {vehicleToEdit ? 'Editar Veículo' : 'Cadastrar Veículo'}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-lg">
              {vehicleToEdit 
                ? 'Atualize as informações do seu veículo.' 
                : 'Cadastre as informações do seu veículo para melhor controle.'
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
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Marca *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Toyota" 
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Modelo *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Corolla" 
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Ano *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2020" 
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Placa *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ABC-1234" 
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        KM Atual *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="50000" 
                            className="h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                            {...field} 
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
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Cor
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Prata" 
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base transition-all duration-300"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Informações Técnicas */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                Informações Técnicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fuelTank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Capacidade do Tanque (L) *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="50" 
                            className="h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base transition-all duration-300"
                            {...field} 
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                            L
                          </div>
                        </div>
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
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Consumo Médio (km/L) *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="12.5" 
                            className="h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base transition-all duration-300"
                            {...field} 
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                            km/L
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Número do Chassi (VIN)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 1HGBH41JXMN109186" 
                          className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl text-base transition-all duration-300"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seguro */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-2xl border border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                Seguro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="insuranceCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Seguradora
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Porto Seguro" 
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
                  name="insurancePolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Número da Apólice
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: PS-123456" 
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
                  name="insuranceExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Vencimento
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full h-12 pl-3 text-left font-normal border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl transition-all duration-300',
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
                        <PopoverContent className="w-auto p-0 rounded-xl border-0 shadow-xl bg-white border border-gray-200" align="start">
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

            {/* Documentação */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
                Documentação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        Número do Documento
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: REG-789012" 
                          className="h-12 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl text-base transition-all duration-300"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        Vencimento
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full h-12 pl-3 text-left font-normal border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl transition-all duration-300',
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
                        <PopoverContent className="w-auto p-0 rounded-xl border-0 shadow-xl bg-white border border-gray-200" align="start">
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
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="mr-2">🚗</span>
                      {vehicleToEdit ? 'Atualizar Veículo' : 'Cadastrar Veículo'}
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
