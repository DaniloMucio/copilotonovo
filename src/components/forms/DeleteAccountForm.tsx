'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

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
import { deleteUserAccount } from '@/services/auth';
import { deleteUserData, UserData } from '@/services/firestore';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória.'),
  confirmation: z.string().refine((val) => val === 'EXCLUIR', {
    message: 'Digite EXCLUIR para confirmar a exclusão.',
  }),
});

type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

interface DeleteAccountFormProps {
  user: User;
  userData: UserData;
  onFormSubmit: () => void;
}

export function DeleteAccountForm({ user, userData, onFormSubmit }: DeleteAccountFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const form = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmation: '',
    },
  });

  async function onSubmit(values: DeleteAccountFormValues) {
    setShowConfirmation(true);
  }

  const handleConfirmDelete = async () => {
    if (!user || !userData) return;

    setIsSubmitting(true);
    try {
      // 1. Primeiro, excluir todos os dados do Firestore
      console.log('🗑️ Excluindo dados do Firestore...');
      await deleteUserData(user.uid, userData.userType);
      
      // 2. Depois, excluir a conta do Firebase Auth
      console.log('🗑️ Excluindo conta do Firebase Auth...');
      await deleteUserAccount(form.getValues('password'));
      
      // 3. Redirecionar para a página inicial
      toast({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída com sucesso. Todos os dados foram removidos permanentemente.',
      });
      
      // Redirecionar para a página inicial
      router.push('/');
      
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error);
      
      let errorMessage = 'Não foi possível excluir sua conta. Tente novamente.';
      
      if (error.message.includes('Senha incorreta')) {
        errorMessage = 'Senha incorreta. Tente novamente.';
      } else if (error.message.includes('recent-login')) {
        errorMessage = 'Por segurança, faça login novamente antes de excluir sua conta.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir conta',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Aviso de segurança */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-800">
                  ⚠️ Ação Irreversível
                </h4>
                <p className="text-sm text-red-700">
                  Esta ação excluirá permanentemente sua conta e todos os dados associados, incluindo:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>Seu perfil e informações pessoais</li>
                  <li>Todas as transações e registros financeiros</li>
                  {userData.userType === 'motorista' && (
                    <>
                      <li>Jornadas de trabalho e dados de veículos</li>
                    </>
                  )}
                  {userData.userType === 'cliente' && (
                    <>
                      <li>Agendamentos e entregas</li>
                    </>
                  )}
                  <li>Notificações e configurações</li>
                </ul>
                <p className="text-sm font-medium text-red-800">
                  Esta ação não pode ser desfeita!
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Campo de senha */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirme sua senha</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Digite sua senha atual" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo de confirmação */}
          <FormField
            control={form.control}
            name="confirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Digite <span className="font-mono font-bold text-red-600">EXCLUIR</span> para confirmar
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite EXCLUIR" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              variant="destructive"
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Excluindo...' : 'Excluir Conta'}
            </Button>
          </DialogFooter>
        </form>
      </Form>

      {/* Modal de confirmação final */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>Confirmar Exclusão da Conta</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a excluir permanentemente sua conta e todos os dados associados.
              </p>
              <p className="font-medium text-red-600">
                Esta ação é irreversível e não pode ser desfeita.
              </p>
              <p>
                Tem certeza absoluta de que deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Excluindo...' : 'Sim, excluir conta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
