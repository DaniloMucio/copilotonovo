'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { UserWithStats } from '@/services/admin';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityIndicatorProps {
  user: UserWithStats;
  showDetails?: boolean;
}

export function ActivityIndicator({ user, showDetails = false }: ActivityIndicatorProps) {
  const hasActivity = user.hasRecentActivity;
  const lastActivity = user.lastActivity;

  if (!showDetails) {
    // Versão simples - apenas badge
    return (
      <Badge 
        variant={hasActivity ? "default" : "secondary"}
        className={`text-xs ${
          hasActivity 
            ? "bg-blue-100 text-blue-800 border-blue-300" 
            : "bg-gray-100 text-gray-600 border-gray-300"
        }`}
      >
        {hasActivity ? (
          <>
            <TrendingUp className="h-3 w-3 mr-1" />
            Ativo recente
          </>
        ) : (
          <>
            <TrendingDown className="h-3 w-3 mr-1" />
            Sem atividade
          </>
        )}
      </Badge>
    );
  }

  // Versão detalhada
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={hasActivity ? "default" : "secondary"}
        className={`text-xs ${
          hasActivity 
            ? "bg-blue-100 text-blue-800 border-blue-300" 
            : "bg-gray-100 text-gray-600 border-gray-300"
        }`}
      >
        {hasActivity ? (
          <>
            <TrendingUp className="h-3 w-3 mr-1" />
            Ativo
          </>
        ) : (
          <>
            <TrendingDown className="h-3 w-3 mr-1" />
            Inativo
          </>
        )}
      </Badge>
      
      {lastActivity && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span title={format(lastActivity, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}>
            {formatDistanceToNow(lastActivity, { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </span>
        </div>
      )}
    </div>
  );
}
