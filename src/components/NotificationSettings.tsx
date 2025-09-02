'use client';

import React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { type NotificationSettings } from '@/services/notifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  BellOff, 
  Package, 
  DollarSign, 
  Clock, 
  AlertCircle,
  Mail,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettings({ open, onOpenChange }: NotificationSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    settings,
    updateSettings,
    initializeNotifications,
    isInitialized,
    isSupported
  } = useNotifications();

  const handleTogglePush = async () => {
    if (!user || !settings) return;

    if (!isInitialized) {
      // Tentar inicializar notificações
      const success = await initializeNotifications();
      if (success) {
        await updateSettings({ pushEnabled: true });
      }
    } else {
      // Alternar estado
      await updateSettings({ 
        pushEnabled: !settings.pushEnabled 
      });
    }
  };

  const handleToggleSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;
    await updateSettings({ [key]: value });
  };

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações de Notificação</DialogTitle>
            <DialogDescription>
              Notificações não são suportadas neste navegador.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <BellOff className="h-12 w-12 mb-2" />
            <p className="text-sm">Navegador não suporta notificações</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações de Notificação</DialogTitle>
          <DialogDescription>
            Gerencie suas preferências de notificação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status das notificações push */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Notificações Push
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-enabled">
                    Ativar notificações push
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receba notificações mesmo com o app fechado
                  </p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={settings?.pushEnabled || false}
                  onCheckedChange={handleTogglePush}
                />
              </div>
              
              {!isInitialized && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800">
                                         <Bell className="h-3 w-3 inline mr-1" />
                     Clique em &quot;Ativar&quot; para permitir notificações no navegador
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Tipos de notificação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tipos de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Entregas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div className="space-y-0.5">
                    <Label htmlFor="delivery-notifications">
                      Entregas
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Novas entregas, status e atualizações
                    </p>
                  </div>
                </div>
                <Switch
                  id="delivery-notifications"
                  checked={settings?.deliveryNotifications || false}
                  onCheckedChange={(checked) => 
                    handleToggleSetting('deliveryNotifications', checked)
                  }
                  disabled={!settings?.pushEnabled}
                />
              </div>

              {/* Pagamentos */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div className="space-y-0.5">
                    <Label htmlFor="payment-notifications">
                      Pagamentos
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Recebimentos e atualizações financeiras
                    </p>
                  </div>
                </div>
                <Switch
                  id="payment-notifications"
                  checked={settings?.paymentNotifications || false}
                  onCheckedChange={(checked) => 
                    handleToggleSetting('paymentNotifications', checked)
                  }
                  disabled={!settings?.pushEnabled}
                />
              </div>

              {/* Jornadas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div className="space-y-0.5">
                    <Label htmlFor="journey-notifications">
                      Jornadas
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Início e fim de jornadas de trabalho
                    </p>
                  </div>
                </div>
                <Switch
                  id="journey-notifications"
                  checked={settings?.journeyNotifications || false}
                  onCheckedChange={(checked) => 
                    handleToggleSetting('journeyNotifications', checked)
                  }
                  disabled={!settings?.pushEnabled}
                />
              </div>

              {/* Sistema */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div className="space-y-0.5">
                    <Label htmlFor="system-notifications">
                      Sistema
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Atualizações e alertas importantes
                    </p>
                  </div>
                </div>
                <Switch
                  id="system-notifications"
                  checked={settings?.systemNotifications || false}
                  onCheckedChange={(checked) => 
                    handleToggleSetting('systemNotifications', checked)
                  }
                  disabled={!settings?.pushEnabled}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Email notifications (futuro) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notificações por Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">
                    Ativar notificações por email
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receba resumos por email (em breve)
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings?.emailNotifications || false}
                  onCheckedChange={(checked) => 
                    handleToggleSetting('emailNotifications', checked)
                  }
                  disabled={true}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Esta funcionalidade estará disponível em breve
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
