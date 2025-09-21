'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { updateUserByAdmin } from '@/services/admin';
import { UserWithStats } from '@/services/admin';
// Removido: funcionalidades de assinatura

const editUserSchema = z.object({
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50, 'Nome deve ter no máximo 50 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional().refine((val) => !val || /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(val), 'Formato de telefone inválido (XX) XXXXX-XXXX'),
  companyName: z.string().optional(),
  userType: z.enum(['motorista', 'cliente', 'admin']),
  isActive: z.boolean(),
  isOnline: z.boolean().optional(),
  cpf: z.string().optional().refine((val) => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val), 'CPF inválido'),
  cnpj: z.string().optional().refine((val) => !val || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(val), 'CNPJ inválido'),
  cnh: z.string().optional(),
  // Campos adicionais para motoristas
  currentMileage: z.number().min(0, 'Quilometragem não pode ser negativa').optional(),
  // Campos de endereço
  address: z.object({
    cep: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface AdminEditUserFormProps {
  user: UserWithStats;
  userData: UserWithStats;
  onFormSubmit: () => void;
  onUserUpdated: () => void;
}

export function AdminEditUserForm({ 
  user, 
  userData, 
  onFormSubmit, 
  onUserUpdated 
}: AdminEditUserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removido: estados de assinatura
  const [loadingPlans, setLoadingPlans] = useState(true);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: userData.displayName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      companyName: userData.companyName || '',
      userType: userData.userType || 'cliente',
      isActive: userData.isActive ?? true,
      isOnline: userData.isOnline ?? false,
      cpf: userData.cpf || '',
      cnpj: userData.cnpj || '',
      cnh: userData.cnh || '',
      currentMileage: (userData as any).currentMileage || 0,
      address: (userData as any).address || {
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      },
    },
  });

  // Carregar planos e assinatura atual
  // Removido: carregamento de planos e assinatura

  async function onSubmit(values: EditUserFormValues) {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Preparar dados para atualização
      const updateData = {
        displayName: values.displayName,
        email: values.email,
        phone: values.phone || '',
        companyName: values.companyName || '',
        userType: values.userType,
        isActive: values.isActive,
        isOnline: values.isOnline,
        cpf: values.cpf || '',
        cnpj: values.cnpj || '',
        cnh: values.cnh || '',
        currentMileage: values.currentMileage || 0,
        address: values.address || {},
      };

      // Atualizar dados do usuário
      await updateUserByAdmin(user.uid, updateData);

      // Removido: gerenciamento de plano

      toast({
        title: 'Usuário atualizado',
        description: 'Os dados do usuário foram atualizados com sucesso.',
      });

      onUserUpdated();
      onFormSubmit();
      
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar usuário',
        description: 'Não foi possível atualizar os dados do usuário. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações básicas */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Informações Básicas</h4>
          
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Digite o email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o telefone" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome da empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campos de documentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNH</FormLabel>
                  <FormControl>
                    <Input placeholder="Número da CNH" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Configurações de conta */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Configurações da Conta</h4>
          
          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Usuário</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de usuário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="motorista">Motorista</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Conta Ativa</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Usuário pode fazer login e usar o sistema
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {userData.userType === 'motorista' && (
            <FormField
              control={form.control}
              name="isOnline"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Online</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Motorista está online e disponível para entregas
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Campos específicos para motoristas */}
        {userData.userType === 'motorista' && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Informações do Motorista</h4>
            
            <FormField
              control={form.control}
              name="currentMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quilometragem Atual</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Digite a quilometragem atual" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Informações de endereço */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Endereço</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rua</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da rua" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="address.number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="UF" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Removido: Gerenciamento de Planos */}

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onFormSubmit}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
