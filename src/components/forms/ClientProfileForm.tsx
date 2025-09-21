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
import { getAddressFromCEP } from '@/services/viacep';
import { Loader2 } from 'lucide-react';

const clientProfileSchema = z.object({
  displayName: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  companyName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres.').optional(),
  cnpj: z.string().min(14, 'CNPJ deve ter pelo menos 14 dígitos.').optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos.').optional(),
  address: z.object({
    cep: z.string().min(8, 'CEP deve ter 8 dígitos.').max(9, 'CEP inválido').optional(),
    street: z.string().min(1, 'Rua é obrigatória.').optional(),
    number: z.string().min(1, 'Número é obrigatório.').optional(),
    neighborhood: z.string().min(1, 'Bairro é obrigatório.').optional(),
    city: z.string().min(1, 'Cidade é obrigatória.').optional(),
    state: z.string().min(1, 'Estado é obrigatório.').optional(),
  }).optional(),
});

type ClientProfileFormValues = z.infer<typeof clientProfileSchema>;

interface ClientProfileFormProps {
  user: User;
  userData: UserData;
  onFormSubmit: () => void;
}

export function ClientProfileForm({ user, userData, onFormSubmit }: ClientProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const form = useForm<ClientProfileFormValues>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      displayName: user.displayName || '',
      companyName: userData.companyName || '',
      cnpj: userData.cnpj || '',
      phone: userData.phone || '',
      address: userData.address || {
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
      },
    },
  });

  useEffect(() => {
    form.reset({
      displayName: user.displayName || '',
      companyName: userData.companyName || '',
      cnpj: userData.cnpj || '',
      phone: userData.phone || '',
      address: userData.address || {
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
      },
    });
  }, [user, userData, form]);

  const handleCepSearch = async (cep: string) => {
    const cepOnlyNumbers = cep.replace(/\D/g, '');
    if (cepOnlyNumbers.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const data = await getAddressFromCEP(cepOnlyNumbers);
      if (data.erro) {
        toast({ variant: 'destructive', title: 'CEP não encontrado.' });
        return;
      }
      form.setValue('address.street', data.logradouro);
      form.setValue('address.neighborhood', data.bairro);
      form.setValue('address.city', data.localidade);
      form.setValue('address.state', data.uf);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar CEP.' });
    } finally {
      setIsFetchingCep(false);
    }
  };

  async function onSubmit(values: ClientProfileFormValues) {
    setIsSubmitting(true);
    try {
      const dataToUpdate: Partial<UserData> = {};
      
      if(values.displayName !== user.displayName) {
        await updateAuthProfile(values.displayName);
        dataToUpdate.displayName = values.displayName;
      }

      dataToUpdate.companyName = values.companyName;
      dataToUpdate.cnpj = values.cnpj;
      dataToUpdate.phone = values.phone;
      dataToUpdate.address = values.address;
      
      await updateUserDocument(user, dataToUpdate);
      
      toast({
        title: 'Sucesso!',
        description: 'Seu perfil de cliente foi atualizado.',
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
              <FormLabel>Nome do Responsável</FormLabel>
              <FormControl>
                <Input placeholder="Nome da pessoa responsável" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Informações da Empresa</h4>
          
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da sua empresa" {...field} />
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone/WhatsApp da Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Endereço da Empresa</h4>
          <p className="text-xs text-muted-foreground">
            Este endereço será usado como remetente nas suas entregas.
          </p>
          
          <FormField
            control={form.control}
            name="address.cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input 
                      {...field} 
                      type="tel" 
                      inputMode="numeric" 
                      placeholder="00000-000"
                      onBlur={(e) => handleCepSearch(e.target.value)}
                    />
                    {isFetchingCep && <Loader2 className="animate-spin h-4 w-4" />}
                  </div>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              name="address.neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="São Paulo" {...field} />
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
                    <Input placeholder="SP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
