import React from 'react';
import { Loader2, Download, Upload, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-current rounded-full animate-pulse',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

interface PulseLoaderProps {
  size?: number;
  color?: 'primary' | 'secondary' | 'muted';
  className?: string;
}

export function PulseLoader({ size = 40, color = 'primary', className }: PulseLoaderProps) {
  const colorClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    muted: 'border-muted-foreground',
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'rounded-full border-2 border-transparent animate-pulse',
          colorClasses[color]
        )}
        style={{ 
          width: size, 
          height: size,
          borderTopColor: 'currentColor',
        }}
      />
      <div
        className={cn(
          'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
          'rounded-full border-2 border-transparent animate-pulse',
          colorClasses[color]
        )}
        style={{ 
          width: size * 0.6, 
          height: size * 0.6,
          borderBottomColor: 'currentColor',
          animationDelay: '0.5s'
        }}
      />
    </div>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

export function Spinner({ size = 'md', variant = 'default', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const variantClasses = {
    default: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )} 
    />
  );
}

interface ActionLoaderProps {
  action: 'download' | 'upload' | 'sync' | 'wifi' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export function ActionLoader({ action, size = 'md', animated = true, className }: ActionLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const icons = {
    download: Download,
    upload: Upload,
    sync: Loader2,
    wifi: Wifi,
    offline: WifiOff,
  };

  const Icon = icons[action];

  return (
    <Icon 
      className={cn(
        sizeClasses[size],
        animated && action === 'sync' && 'animate-spin',
        animated && action === 'download' && 'animate-bounce',
        animated && action === 'upload' && 'animate-pulse',
        animated && action === 'wifi' && 'animate-pulse',
        className
      )} 
    />
  );
}

interface LoadingTextProps {
  text: string;
  dots?: boolean;
  className?: string;
}

export function LoadingText({ text, dots = true, className }: LoadingTextProps) {
  const [dotCount, setDotCount] = React.useState(0);

  React.useEffect(() => {
    if (!dots) return;

    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [dots]);

  return (
    <span className={cn('text-muted-foreground', className)}>
      {text}
      {dots && '.'.repeat(dotCount)}
    </span>
  );
}

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// Adicionar animação shimmer ao CSS global se necessário
const shimmerKeyframes = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`;

interface InlineLoaderProps {
  text: string;
  type?: 'dots' | 'spinner' | 'pulse';
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineLoader({ text, type = 'dots', size = 'sm', className }: InlineLoaderProps) {
  const LoaderComponent = {
    dots: () => <LoadingDots size={size} />,
    spinner: () => <Spinner size={size} />,
    pulse: () => <PulseLoader size={size === 'sm' ? 16 : 20} />,
  }[type];

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoaderComponent />
      <LoadingText text={text} dots={type === 'dots'} />
    </div>
  );
}
