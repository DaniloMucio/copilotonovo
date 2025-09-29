'use client';

import { motion, MotionProps } from 'framer-motion';
import { useIsMobile, useIsLowEndDevice } from '@/hooks/use-mobile';
import { ReactNode, memo } from 'react';

interface OptimizedMotionProps extends Omit<MotionProps, 'children'> {
  children: ReactNode;
  fallback?: ReactNode;
  disableOnMobile?: boolean;
  disableOnLowEnd?: boolean;
  className?: string;
}

export const OptimizedMotion = memo(function OptimizedMotion({ 
  children, 
  fallback, 
  disableOnMobile = false,
  disableOnLowEnd = false,
  className,
  ...motionProps 
}: OptimizedMotionProps) {
  const isMobile = useIsMobile();
  const isLowEnd = useIsLowEndDevice();
  
  // Se for mobile ou dispositivo de baixa performance, usar fallback ou animação simples
  if ((isMobile && disableOnMobile) || (isLowEnd && disableOnLowEnd)) {
    return <div className={className}>{fallback || children}</div>;
  }

  // Animações simplificadas para mobile - apenas fade
  if (isMobile) {
    const simplifiedProps = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2, ease: "easeOut" }
    };
    
    return <motion.div className={className} {...simplifiedProps}>{children}</motion.div>;
  }

  // Animações completas para desktop
  return <motion.div className={className} {...motionProps}>{children}</motion.div>;
});

// Componente específico para skeletons otimizados
export const OptimizedSkeleton = memo(function OptimizedSkeleton({ 
  children, 
  className = "",
  ...props 
}: { 
  children?: ReactNode; 
  className?: string;
  [key: string]: any;
}) {
  const isMobile = useIsMobile();
  const isLowEnd = useIsLowEndDevice();
  
  if (isMobile || isLowEnd) {
    // Skeleton simples sem animações complexas
    return (
      <div className={`animate-pulse ${className}`} {...props}>
        {children}
      </div>
    );
  }

  // Skeleton com animações para desktop
  return (
    <OptimizedMotion
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={className}
      {...props}
    >
      {children}
    </OptimizedMotion>
  );
});

// Hook para animações condicionais otimizado
export function useOptimizedAnimation() {
  const isMobile = useIsMobile();
  const isLowEnd = useIsLowEndDevice();
  
  return {
    isMobile,
    isLowEnd,
    shouldAnimate: !isMobile && !isLowEnd,
    animationProps: {
      initial: isMobile ? { opacity: 0 } : { opacity: 0, y: 20 },
      animate: isMobile ? { opacity: 1 } : { opacity: 1, y: 0 },
      transition: isMobile ? { duration: 0.15, ease: "easeOut" } : { duration: 0.3, ease: "easeOut" }
    }
  };
}
