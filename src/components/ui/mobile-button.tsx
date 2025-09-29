'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export function MobileButton({ 
  className, 
  variant = 'primary', 
  size = 'md',
  children,
  ...props 
}: MobileButtonProps) {
  const isMobile = useIsMobile();

  const getVariantClasses = () => {
    if (isMobile) {
      switch (variant) {
        case 'primary':
          return 'mobile-button-primary';
        case 'secondary':
          return 'mobile-button-secondary';
        case 'outline':
          return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
        case 'ghost':
          return 'bg-transparent text-gray-700 hover:bg-gray-100';
        case 'destructive':
          return 'bg-red-600 text-white hover:bg-red-700';
        default:
          return 'mobile-button-primary';
      }
    }
    
    // Desktop variants
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'secondary':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      case 'outline':
        return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
      case 'ghost':
        return 'bg-transparent text-gray-700 hover:bg-gray-100';
      case 'destructive':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getSizeClasses = () => {
    if (isMobile) {
      switch (size) {
        case 'sm':
          return 'h-10 px-3 text-sm';
        case 'md':
          return 'h-12 px-4 text-sm';
        case 'lg':
          return 'h-14 px-6 text-base';
        default:
          return 'h-12 px-4 text-sm';
      }
    }
    
    // Desktop sizes
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-xs';
      case 'md':
        return 'h-10 px-4 text-sm';
      case 'lg':
        return 'h-12 px-6 text-base';
      default:
        return 'h-10 px-4 text-sm';
    }
  };

  return (
    <Button
      className={cn(
        'mobile-button transition-all duration-200',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
