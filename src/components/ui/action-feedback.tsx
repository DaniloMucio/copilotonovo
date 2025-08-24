import React from 'react';
import { Check, X, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ActionState {
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info';
  message?: string;
}

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  actionState: ActionState;
  children: React.ReactNode;
  successMessage?: string;
  errorMessage?: string;
  resetDelay?: number;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ActionButton({
  actionState,
  children,
  successMessage,
  errorMessage,
  resetDelay = 3000,
  variant = 'default',
  size = 'default',
  className,
  ...props
}: ActionButtonProps) {
  const [showFeedback, setShowFeedback] = React.useState(false);

  React.useEffect(() => {
    if (actionState.status === 'success' || actionState.status === 'error') {
      setShowFeedback(true);
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, resetDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [actionState.status, resetDelay]);

  const getIcon = () => {
    switch (actionState.status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'error':
        return <X className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getVariant = () => {
    if (actionState.status === 'success') return 'default';
    if (actionState.status === 'error') return 'destructive';
    return variant;
  };

  const getMessage = () => {
    if (actionState.message) return actionState.message;
    if (actionState.status === 'success' && successMessage) return successMessage;
    if (actionState.status === 'error' && errorMessage) return errorMessage;
    return null;
  };

  const isDisabled = actionState.status === 'loading' || props.disabled;

  return (
    <Button
      {...props}
      variant={getVariant()}
      size={size}
      disabled={isDisabled}
      className={cn(
        'transition-all duration-200',
        actionState.status === 'success' && 'bg-green-600 hover:bg-green-700',
        className
      )}
    >
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span>
          {showFeedback && getMessage() ? getMessage() : children}
        </span>
      </div>
    </Button>
  );
}

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'error' | 'idle';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  size = 'md',
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusConfig = {
    online: { color: 'bg-green-500', animation: '', label: 'Online' },
    offline: { color: 'bg-gray-500', animation: '', label: 'Offline' },
    connecting: { color: 'bg-yellow-500', animation: 'animate-pulse', label: 'Conectando...' },
    error: { color: 'bg-red-500', animation: 'animate-pulse', label: 'Erro' },
    idle: { color: 'bg-gray-300', animation: '', label: 'Inativo' },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          config.color,
          config.animation
        )}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {label || config.label}
        </span>
      )}
    </div>
  );
}

interface ProgressFeedbackProps {
  progress: number;
  total: number;
  label?: string;
  actionLabel?: string;
  showETA?: boolean;
  startTime?: Date;
  className?: string;
}

export function ProgressFeedback({
  progress,
  total,
  label,
  actionLabel = 'Processando',
  showETA = false,
  startTime,
  className,
}: ProgressFeedbackProps) {
  const percentage = Math.round((progress / total) * 100);
  
  const getETA = () => {
    if (!startTime || progress === 0) return null;
    
    const elapsed = Date.now() - startTime.getTime();
    const rate = progress / elapsed;
    const remaining = total - progress;
    const eta = remaining / rate;
    
    return new Date(Date.now() + eta);
  };

  const formatETA = (eta: Date) => {
    const minutes = Math.ceil((eta.getTime() - Date.now()) / 60000);
    if (minutes < 1) return 'Menos de 1 minuto';
    if (minutes === 1) return '1 minuto';
    return `${minutes} minutos`;
  };

  const eta = showETA ? getETA() : null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {label || actionLabel}
          </div>
          <div className="text-xs text-muted-foreground">
            {progress} de {total} itens
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-sm font-medium">{percentage}%</div>
          {eta && (
            <div className="text-xs text-muted-foreground">
              ETA: {formatETA(eta)}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  type?: 'spinner' | 'progress';
  progress?: number;
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isVisible,
  message = 'Carregando...',
  type = 'spinner',
  progress,
  className,
  children,
}: LoadingOverlayProps) {
  if (!isVisible) return <>{children}</>;

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card p-6 rounded-lg shadow-lg space-y-4 min-w-48">
          <div className="flex items-center space-x-3">
            {type === 'spinner' && <Loader2 className="w-6 h-6 animate-spin" />}
            <span className="text-sm font-medium">{message}</span>
          </div>
          {type === 'progress' && progress !== undefined && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
