"use client";

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// Hook para detectar quando elemento entra na viewport
function useInView(options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return [ref, isInView] as const;
}

// Componente base para animações com CSS
interface AnimatedElementProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'slideInLeft' | 'slideInRight' | 'scaleIn' | 'bounceIn';
  delay?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
}

export function AnimatedElement({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration = 0.5,
  className,
  triggerOnce = true,
}: AnimatedElementProps) {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const [hasAnimated, setHasAnimated] = useState(false);

  const shouldAnimate = triggerOnce ? (isInView && !hasAnimated) : isInView;

  useEffect(() => {
    if (isInView && triggerOnce) {
      setHasAnimated(true);
    }
  }, [isInView, triggerOnce]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        shouldAnimate ? `animate-${animation}` : 'opacity-0',
        className
      )}
      style={{
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// Componente para fade in simples
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-opacity duration-500 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// Componente para slide up
interface SlideUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function SlideUp({ children, className, delay = 0 }: SlideUpProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  );
}

// Componente para lista com stagger
interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className, staggerDelay = 100 }: StaggeredListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <SlideUp key={index} delay={index * staggerDelay / 1000}>
          {child}
        </SlideUp>
      ))}
    </div>
  );
}

// Componente para cards com hover suave
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AnimatedCard({ children, className, onClick }: AnimatedCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'transition-all duration-200 ease-out',
        'hover:shadow-lg hover:-translate-y-1',
        'active:scale-[0.98]',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

// Componente para botões animados
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'scale' | 'bounce' | 'glow';
  disabled?: boolean;
}

export function AnimatedButton({ 
  children, 
  onClick, 
  className, 
  variant = 'scale',
  disabled = false 
}: AnimatedButtonProps) {
  const variantClasses = {
    scale: 'hover:scale-105 active:scale-95',
    bounce: 'hover:-translate-y-0.5 active:translate-y-0',
    glow: 'hover:shadow-lg hover:shadow-primary/25',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'transition-all duration-150 ease-out',
        !disabled && variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

// Componente para modal com backdrop animado
interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedModal({ isOpen, onClose, children, className }: AnimatedModalProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-black/50 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
      />
      
      {/* Modal Content */}
      <div
        className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'transition-all duration-200 ease-out',
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Componente para loading com pulso
interface PulsingLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulsingLoader({ size = 'md', className }: PulsingLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-primary animate-pulse',
        sizeClasses[size],
        className
      )}
    />
  );
}

// Componente para progresso animado
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

export function AnimatedProgress({ 
  value, 
  max = 100, 
  className, 
  barClassName 
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('w-full bg-secondary rounded-full h-2 overflow-hidden', className)}>
      <div
        className={cn(
          'h-full bg-primary rounded-full transition-all duration-500 ease-out',
          barClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Componente para contador animado
interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({ 
  from, 
  to, 
  duration = 1, 
  className, 
  prefix = '', 
  suffix = '' 
}: AnimatedCounterProps) {
  const [count, setCount] = useState(from);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
      }
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return undefined;

    const increment = (to - from) / (duration * 60); // 60fps
    let current = from;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= to) || (increment < 0 && current <= to)) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [from, to, duration, isVisible]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}

// Componente para transições de página
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}

// Componente para tooltip animado
interface AnimatedTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function AnimatedTooltip({ content, children, position = 'top' }: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap',
            'transition-all duration-150 ease-out',
            'animate-fade-in',
            positionClasses[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
