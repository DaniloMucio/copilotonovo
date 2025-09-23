'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Settings,
  Package,
  DollarSign,
  Clock,
  AlertCircle,
  Info,
  Trash2,
  Calendar,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { NotificationSettings } from './NotificationSettings';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    clearOldNotifications,
    deleteNotification,
    isInitialized,
    isSupported
  } = useNotifications();

  const [showSettings, setShowSettings] = useState(false);

  // Função para obter ícone baseado no tipo de notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delivery':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'journey':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  // Função para obter cor do badge baseado no tipo
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'delivery':
        return 'default';
      case 'payment':
        return 'secondary';
      case 'journey':
        return 'outline';
      case 'system':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Função para obter texto do tipo
  const getTypeText = (type: string) => {
    switch (type) {
      case 'delivery':
        return 'Entrega';
      case 'payment':
        return 'Pagamento';
      case 'journey':
        return 'Jornada';
      case 'system':
        return 'Sistema';
      default:
        return 'Geral';
    }
  };

  if (!isSupported) {
    return (
      <div className={cn("flex items-center", className)}>
        <Button variant="ghost" size="icon" disabled>
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={cn("flex items-center", className)}>
        <Button variant="ghost" size="icon" disabled>
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 text-blue-600" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80 p-0 bg-white border-0 shadow-2xl rounded-2xl">
          <Card className="border-0 shadow-none bg-white">
            <CardHeader className="pb-3 bg-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">Notificações</CardTitle>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-8 px-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      Marcar todas
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearOldNotifications(30)}
                        className="h-8 px-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                        title="Limpar notificações antigas (30+ dias)"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllNotifications}
                        className="h-8 px-2 bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                        title="Limpar todas as notificações"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="h-8 px-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="p-0 bg-white">
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Bell className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-sm text-gray-900">Nenhuma notificação</p>
                    <p className="text-xs text-gray-600">Você receberá notificações aqui</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 hover:bg-gray-50 transition-colors cursor-pointer bg-white",
                          !notification.read && "bg-blue-50/50 border-l-2 border-l-blue-500"
                        )}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id!);
                          }
                          // Aqui você pode adicionar navegação para a URL da ação
                          if (notification.actionUrl) {
                            window.location.href = notification.actionUrl;
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate text-gray-900">
                                {notification.title}
                              </p>
                              <Badge 
                                variant={getBadgeVariant(notification.type)}
                                className="text-xs bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 border-0 rounded-full shadow-sm"
                              >
                                {getTypeText(notification.type)}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {notification.body}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-600">
                                {format(notification.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </p>
                              
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id!);
                                  }}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                                  title="Deletar notificação"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de configurações */}
      {showSettings && (
        <NotificationSettings
          open={showSettings}
          onOpenChange={setShowSettings}
        />
      )}
    </div>
  );
}
