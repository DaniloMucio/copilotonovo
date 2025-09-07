'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User } from 'firebase/auth';

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
import { updateUserProfile as updateAuthProfile } from '@/services/auth';
import { updateUserDocument, UserData } from '@/services/firestore';
import { Separator } from '@/components/ui/separator';

const driverProfileSchema = z.object({
  displayName: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  cpf: z.string().min(11, 'CPF deve ter pelo menos 11 dígitos.').optional(),
  cnh: z.string().min(5, 'CNH deve ter pelo menos 5 caracteres.').optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos.').optional(),
});

type DriverProfileFormValues = z.infer<typeof driverProfileSchema>;

interface DriverProfileFormProps {
  user: User;
  userData: UserData;
  onFormSubmit: () => void;
}

export function DriverProfileForm({ user, userData, onFormSubmit }: DriverProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DriverProfileFormValues>({
    resolver: zodResolver(driverProfileSchema),
    defaultValues: {
      displayName: user.displayName || '',
      cpf: userData.cpf || '',
      cnh: userData.cnh || '',
      phone: userData.phone || '',
    },
  });

  useEffect(() => {
    form.reset({
      displayName: user.displayName || '',
      cpf: userData.cpf || '',
      cnh: userData.cnh || '',
      phone: userData.phone || '',
    });
  }, [user, userData, form]);

  async function onSubmit(values: DriverProfileFormValues) {
    setIsSubmitting(true);
    try {
      const dataToUpdate: Partial<UserData> = {};
      
      if(values.displayName !== user.displayName) {
        await updateAuthProfile(values.displayName);
        dataToUpdate.displayName = values.displayName;
      }

      dataToUpdate.cpf = values.cpf;
      dataToUpdate.cnh = values.cnh;
      dataToUpdate.phone = values.phone;
      
      await updateUserDocument(user, dataToUpdate);
      
      toast({
        title: 'Sucesso!',
        description: 'Seu perfil de motorista foi atualizado.',
      });
      onFormSubmit();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar perfil',
        description: 'Ocorreu um problema ao salvar suas informações. Tente novamente.',
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
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Documentos Pessoais</h4>
          
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
            name="cnh"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNH (Carteira Nacional de Habilitação)</FormLabel>
                <FormControl>
                  <Input placeholder="Número da sua CNH" {...field} />
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
                <FormLabel>Telefone/WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
