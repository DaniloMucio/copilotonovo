'use client';

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellRing, 
  Package, 
  DollarSign, 
  Clock, 
  AlertCircle,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function NotificationTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    initializeNotifications,
    isInitialized,
    isSupported,
    unreadCount,
    refreshNotifications
  } = useNotifications();

  const handleTestNotification = async (type: 'delivery' | 'payment' | 'journey' | 'system') => {
    if (!user) return;

    try {
      const { notificationService } = await import('@/services/notifications');
      
      switch (type) {
        case 'delivery':
          await notificationService.sendNotificationToUser(
            user.uid,
            'Nova Entrega Disponível',
            'Você recebeu uma nova solicitação de entrega. Verifique os detalhes.',
            'delivery',
            { actionUrl: '/dashboard/entregas' }
          );
          break;
        case 'payment':
          await notificationService.sendNotificationToUser(
            user.uid,
            'Pagamento Recebido',
            'Você recebeu o pagamento de uma entrega.',
            'payment',
            { actionUrl: '/dashboard/financeiro' }
          );
          break;
        case 'journey':
          await notificationService.sendNotificationToUser(
            user.uid,
            'Jornada Iniciada',
            'Sua jornada de trabalho foi iniciada com sucesso!',
            'journey',
            { actionUrl: '/dashboard/jornada' }
          );
          break;
        case 'system':
          await notificationService.sendNotificationToUser(
            user.uid,
            'Atualização do Sistema',
            'Uma nova versão do app está disponível.',
            'system',
            { actionUrl: '/dashboard' }
          );
          break;
      }

      toast({
        title: "Notificação de Teste Enviada",
        description: `Notificação do tipo "${type}" foi enviada com sucesso.`,
      });

      // Atualizar lista de notificações
      await refreshNotifications();
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível enviar a notificação de teste.',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Teste de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mb-2" />
            <p className="text-sm">Navegador não suporta notificações</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Teste de Notificações
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} não lidas
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {isInitialized ? (
              <BellRing className="h-4 w-4 text-green-600" />
            ) : (
              <Bell className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">
              Status: {isInitialized ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          {!isInitialized && (
            <Button
              size="sm"
              onClick={initializeNotifications}
            >
              Ativar
            </Button>
          )}
        </div>

        {/* Botões de teste */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTestNotification('delivery')}
            disabled={!isInitialized}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Entrega
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTestNotification('payment')}
            disabled={!isInitialized}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Pagamento
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTestNotification('journey')}
            disabled={!isInitialized}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Jornada
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTestNotification('system')}
            disabled={!isInitialized}
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Sistema
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Clique nos botões para enviar notificações de teste</p>
          <p>• As notificações aparecerão no centro de notificações</p>
          <p>• Em background, as notificações aparecerão como push notifications</p>
        </div>
      </CardContent>
    </Card>
  );
}
