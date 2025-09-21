'use client';

import { useState } from 'react';
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
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserData } from '@/services/firestore';

const createUserSchema = z.object({
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  userType: z.enum(['motorista', 'cliente', 'admin']),
  isActive: z.boolean(),
  isOnline: z.boolean().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface AdminCreateUserFormProps {
  onFormSubmit: () => void;
  onUserCreated: () => void;
}

export function AdminCreateUserForm({ 
  onFormSubmit, 
  onUserCreated
}: AdminCreateUserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      phone: '',
      companyName: '',
      userType: 'cliente',
      isActive: true,
      isOnline: false,
    },
  });

  async function onSubmit(values: CreateUserFormValues) {
    setIsSubmitting(true);
    try {
      // Gerar um ID único para o usuário (simulando o que o Firebase Auth faria)
      const userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Criar documento do usuário no Firestore
      const userData: UserData = {
        displayName: values.displayName,
        email: values.email,
        phone: values.phone || '',
        companyName: values.companyName || '',
        userType: values.userType,
        isActive: values.isActive,
        isOnline: values.isOnline || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Adicionar campos para indicar que é um usuário temporário
        tempPassword: values.password, // Senha temporária para o admin saber
        needsAuthSetup: true, // Flag para indicar que precisa configurar autenticação
      };

      await setDoc(doc(db, 'users', userId), userData);

      console.log('Usuário criado temporariamente:', userId);

      toast({
        title: 'Usuário criado',
        description: `Usuário criado com sucesso! ID: ${userId}. O usuário precisará configurar a autenticação no primeiro login.`,
      });

      onUserCreated();
      onFormSubmit();
      
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      toast({
        variant: 'destructive',
        title: 'Erro ao criar usuário',
        description: 'Não foi possível criar o usuário. Tente novamente.',
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
                <FormLabel>Nome Completo *</FormLabel>
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Digite o email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha *</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Digite a senha" {...field} />
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
        </div>

        {/* Configurações de conta */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Configurações da Conta</h4>
          
          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Usuário *</FormLabel>
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

          {form.watch('userType') === 'motorista' && (
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
            {isSubmitting ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
