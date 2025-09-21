'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { User } from 'firebase/auth';
import { UserData } from '@/services/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  User as UserIcon, 
  Key, 
  Bell, 
  Smartphone, 
  Trash2
} from 'lucide-react';

// Importar formulários existentes
import { ClientProfileForm } from '@/components/forms/ClientProfileForm';
import { DriverProfileForm } from '@/components/forms/DriverProfileForm';
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';
import { DeleteAccountForm } from '@/components/forms/DeleteAccountForm';
import { NotificationSettings } from '@/components/NotificationSettings';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { usePWAInstall } from '@/hooks/use-pwa-install';

interface SettingsManagerProps {
  user: User;
  userData: UserData;
}

export function SettingsManager({ user, userData }: SettingsManagerProps) {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { canInstall: pwaCanInstall, installApp: pwaInstall } = usePWAInstall();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);

  // Sincronizar com URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);


  const handleProfileUpdate = () => {
    setIsProfileDialogOpen(false);
    // Recarregar a página para atualizar os dados
    window.location.reload();
    toast({
      title: 'Sucesso!',
      description: 'Perfil atualizado com sucesso.'
    });
  };

  const handlePasswordUpdate = () => {
    setIsPasswordDialogOpen(false);
    toast({
      title: 'Sucesso!',
      description: 'Senha alterada com sucesso.'
    });
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountDialogOpen(false);
    // A função de redirecionamento será tratada no componente DeleteAccountForm
  };

  const handleNotificationUpdate = () => {
    setIsNotificationDialogOpen(false);
    toast({
      title: 'Sucesso!',
      description: 'Configurações de notificação atualizadas.'
    });
  };



  return (
    <div className="mt-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`w-full ${isMobile ? 'flex overflow-x-auto scrollbar-hide' : 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7'}`}>
          <TabsTrigger value="profile" className={isMobile ? 'flex-shrink-0' : ''}>Perfil</TabsTrigger>
          <TabsTrigger value="security" className={isMobile ? 'flex-shrink-0' : ''}>Segurança</TabsTrigger>
          <TabsTrigger value="notifications" className={isMobile ? 'flex-shrink-0' : ''}>Notificações</TabsTrigger>
          <TabsTrigger value="app" className={isMobile ? 'flex-shrink-0' : ''}>App</TabsTrigger>
          <TabsTrigger value="danger" className={isMobile ? 'flex-shrink-0' : ''}>Conta</TabsTrigger>
        </TabsList>

        {/* Aba Perfil */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Gerencie suas informações pessoais e dados da conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Nome Completo</p>
                  <p className="text-sm text-muted-foreground">{userData.displayName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tipo de Conta</p>
                  <p className="text-sm text-muted-foreground capitalize">{userData.userType}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Conta Criada</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.metadata.creationTime || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              <Button onClick={() => setIsProfileDialogOpen(true)}>
                <UserIcon className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Segurança */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Segurança da Conta
              </CardTitle>
              <CardDescription>
                Gerencie sua senha e configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Alterar Senha</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mantenha sua conta segura com uma senha forte e única
                  </p>
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Informações de Segurança</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Última atualização da senha:</span> Não disponível</p>
                    <p><span className="font-medium">Conta criada em:</span> {new Date(user.metadata.creationTime || '').toLocaleDateString('pt-BR')}</p>
                    <p><span className="font-medium">Último login:</span> {new Date(user.metadata.lastSignInTime || '').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Notificações */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificação
              </CardTitle>
              <CardDescription>
                Configure como e quando receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Notificações Push</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Receba notificações em tempo real sobre suas atividades
                  </p>
                  <Button variant="outline" onClick={() => setIsNotificationDialogOpen(true)}>
                    <Bell className="h-4 w-4 mr-2" />
                    Configurar Notificações
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Status das Notificações</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Push notifications:</span> <span className="text-green-600">Ativo</span></p>
                    <p><span className="font-medium">Email notifications:</span> <span className="text-green-600">Ativo</span></p>
                    <p><span className="font-medium">Som:</span> <span className="text-green-600">Ativo</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Aba App */}
        <TabsContent value="app" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Configurações do Aplicativo
              </CardTitle>
              <CardDescription>
                Configurações do aplicativo e PWA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Instalar Aplicativo</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Instale o Co-Piloto como um aplicativo nativo no seu dispositivo
                  </p>
                  <PWAInstallButton canInstall={pwaCanInstall} install={pwaInstall} />
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Informações do App</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Versão:</span> 1.0.0</p>
                    <p><span className="font-medium">Build:</span> 2024.01.01</p>
                    <p><span className="font-medium">Plataforma:</span> Web PWA</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Conta */}
        <TabsContent value="danger" className="mt-6">
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Trash2 className="h-5 w-5" />
                Configurações da Conta
              </CardTitle>
              <CardDescription className="text-red-700">
                Ações irreversíveis que afetam sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-medium mb-2 text-red-800">Excluir Conta</h4>
                <p className="text-sm text-red-700 mb-3">
                  Esta ação excluirá permanentemente sua conta e todos os dados associados. 
                  Esta ação não pode ser desfeita.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteAccountDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      
      {/* Diálogo de Editar Perfil */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>Altere suas informações de perfil.</DialogDescription>
          </DialogHeader>
          {userData.userType === 'cliente' ? (
            <ClientProfileForm 
              user={user} 
              userData={userData} 
              onFormSubmit={handleProfileUpdate}
            />
          ) : (
            <DriverProfileForm 
              user={user} 
              userData={userData} 
              onFormSubmit={handleProfileUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Alterar Senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>Defina uma nova senha para sua conta.</DialogDescription>
          </DialogHeader>
          <ChangePasswordForm onFormSubmit={handlePasswordUpdate} />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Excluir Conta */}
      <Dialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Conta</DialogTitle>
            <DialogDescription>Exclua permanentemente sua conta e todos os dados associados.</DialogDescription>
          </DialogHeader>
          <DeleteAccountForm 
            user={user} 
            userData={userData} 
            onFormSubmit={handleDeleteAccount}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Notificações */}
      <NotificationSettings 
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
      />
    </div>
  );
}
