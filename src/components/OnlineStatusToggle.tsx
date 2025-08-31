'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { updateDriverStatus } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff } from 'lucide-react';

export function OnlineStatusToggle() {
  const { userData, user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Inicializar com o status atual do usuário
    if (userData?.isOnline !== undefined) {
      setIsOnline(userData.isOnline);
    }
  }, [userData?.isOnline]);

  // Só mostrar para motoristas
  if (userData?.userType !== 'motorista') {
    return null;
  }

  const handleStatusChange = async (checked: boolean) => {
    if (!user?.uid) return;

    setIsUpdating(true);
    try {
      await updateDriverStatus(user.uid, checked);
      setIsOnline(checked);
      
      toast({
        title: checked ? 'Status Online' : 'Status Offline',
        description: checked 
          ? 'Você está agora visível para clientes' 
          : 'Você não está mais visível para clientes',
        variant: checked ? 'default' : 'default'
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      });
      // Reverter o estado em caso de erro
      setIsOnline(!checked);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-gray-500" />
        )}
        <Label htmlFor="online-status" className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </Label>
      </div>
      <Switch
        id="online-status"
        checked={isOnline}
        onCheckedChange={handleStatusChange}
        disabled={isUpdating}
        className="data-[state=checked]:bg-green-600"
      />
    </div>
  );
}
