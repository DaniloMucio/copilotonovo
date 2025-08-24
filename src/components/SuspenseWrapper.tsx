import { Suspense, ReactNode } from 'react';
import { 
  LoadingFallback, 
  FormLoadingFallback, 
  TableLoadingFallback, 
  DashboardLoadingFallback, 
  ComponentLoadingFallback 
} from './LoadingFallback';
import ErrorBoundary from './ErrorBoundary';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallbackType?: 'default' | 'form' | 'table' | 'dashboard' | 'component';
  message?: string;
  withErrorBoundary?: boolean;
}

const getFallbackComponent = (type: string, message?: string) => {
  switch (type) {
    case 'form':
      return <FormLoadingFallback />;
    case 'table':
      return <TableLoadingFallback />;
    case 'dashboard':
      return <DashboardLoadingFallback />;
    case 'component':
      return <ComponentLoadingFallback />;
    default:
      return <LoadingFallback message={message} />;
  }
};

export function SuspenseWrapper({ 
  children, 
  fallbackType = 'default', 
  message,
  withErrorBoundary = true 
}: SuspenseWrapperProps) {
  const fallback = getFallbackComponent(fallbackType, message);

  const content = (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );

  if (withErrorBoundary) {
    return (
      <ErrorBoundary>
        {content}
      </ErrorBoundary>
    );
  }

  return content;
}

// Wrappers específicos para facilitar o uso
export function FormSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseWrapper fallbackType="form">
      {children}
    </SuspenseWrapper>
  );
}

export function TableSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseWrapper fallbackType="table">
      {children}
    </SuspenseWrapper>
  );
}

export function DashboardSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseWrapper fallbackType="dashboard">
      {children}
    </SuspenseWrapper>
  );
}

export function ComponentSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseWrapper fallbackType="component">
      {children}
    </SuspenseWrapper>
  );
}
