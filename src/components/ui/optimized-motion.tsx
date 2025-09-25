'use client';

import { motion, MotionProps } from 'framer-motion';
import { useIsMobile, useIsLowEndDevice } from '@/hooks/use-mobile';
import { ReactNode } from 'react';

interface OptimizedMotionProps extends Omit<MotionProps, 'children'> {
  children: ReactNode;
  fallback?: ReactNode;
  disableOnMobile?: boolean;
  disableOnLowEnd?: boolean;
  className?: string;
}

export function OptimizedMotion({ 
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

  // Animações simplificadas para mobile
  if (isMobile) {
    const simplifiedProps = {
      ...motionProps,
      initial: motionProps.initial || { opacity: 0 },
      animate: motionProps.animate || { opacity: 1 },
      transition: {
        duration: 0.3, // Duração mais curta
        ...motionProps.transition
      }
    };
    
    return <motion.div className={className} {...simplifiedProps}>{children}</motion.div>;
  }

  // Animações completas para desktop
  return <motion.div className={className} {...motionProps}>{children}</motion.div>;
}

// Componente específico para skeletons otimizados
export function OptimizedSkeleton({ 
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
}

// Hook para animações condicionais
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
      transition: isMobile ? { duration: 0.2 } : { duration: 0.4 }
    }
  };
}
