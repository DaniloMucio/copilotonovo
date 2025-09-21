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
    },
  });

  async function onSubmit(values: DeleteAccountFormValues) {
    setShowConfirmation(true);
  }

  const handleConfirmDelete = async () => {
    if (!user || !userData) return;

    setIsSubmitting(true);
    try {
      // 1. Primeiro, excluir TODOS os dados do Firestore (exclusão completa)
      console.log('🗑️ EXCLUSÃO COMPLETA: Removendo todos os dados do Firestore...');
      const { deleteUserCompletely } = await import('@/services/firestore');
      const deletionResult = await deleteUserCompletely(user.uid, userData.userType, false);
      
      if (!deletionResult.success) {
        console.warn('⚠️ Exclusão parcial dos dados:', deletionResult.errors);
        toast({
          variant: 'destructive',
          title: 'Aviso',
          description: `Dados removidos parcialmente (${deletionResult.deletedCount} documentos). Alguns dados podem ter permanecido.`,
        });
      } else {
        console.log(`✅ EXCLUSÃO COMPLETA: ${deletionResult.deletedCount} documentos removidos com sucesso`);
      }
      
      // 2. Depois, excluir a conta do Firebase Auth
      console.log('🗑️ Excluindo conta do Firebase Auth...');
      await deleteUserAccount(form.getValues('password'));
      
      // 3. Redirecionar para a página inicial
      toast({
        title: 'Conta excluída completamente',
        description: `Sua conta foi excluída com sucesso. ${deletionResult.deletedCount} documentos foram removidos permanentemente.`,
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
          {/* Aviso de segurança - Exclusão Completa */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-red-800 dark:text-red-200">
                    🗑️ EXCLUSÃO COMPLETA E IRREVERSÍVEL
                  </h4>
                </div>
                
                <div className="text-sm text-red-700 dark:text-red-300">
                  Esta ação removerá <strong>COMPLETAMENTE</strong> sua conta e <strong>TODOS</strong> os dados relacionados do sistema.
                </div>

                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
                  <div className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                    📋 Dados que serão excluídos permanentemente:
                  </div>
                  <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                    <li><strong>Perfil completo</strong> e informações pessoais</li>
                    <li><strong>Todas as transações</strong> financeiras</li>
                    <li><strong>Todas as entregas</strong> (como cliente ou motorista)</li>
                    {userData.userType === 'motorista' && (
                      <>
                        <li><strong>Jornadas de trabalho</strong> e dados de veículos</li>
                        <li><strong>Histórico de quilometragem</strong></li>
                      </>
                    )}
                    {userData.userType === 'cliente' && (
                      <>
                        <li><strong>Agendamentos</strong> e entregas</li>
                        <li><strong>Histórico de pedidos</strong></li>
                      </>
                    )}
                    <li><strong>Notificações</strong> e configurações</li>
                    <li><strong>Histórico completo</strong> de atividades</li>
                  </ul>
                </div>

                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md">
                  <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    ℹ️ IMPORTANTE
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Após a exclusão, seu email <strong>{userData.email}</strong> poderá ser reutilizado para criar uma nova conta.
                  </div>
                </div>

                <div className="text-sm font-bold text-red-800 dark:text-red-200 text-center p-2 bg-red-200 dark:bg-red-800/50 rounded">
                  ⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA! ⚠️
                </div>
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
              <div>
                Você está prestes a excluir permanentemente sua conta e todos os dados associados.
              </div>
              <div className="font-medium text-red-600">
                Esta ação é irreversível e não pode ser desfeita.
              </div>
              <div>
                Tem certeza absoluta de que deseja continuar?
              </div>
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
