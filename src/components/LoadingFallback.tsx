import { Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface LoadingFallbackProps {
  type?: 'spinner' | 'skeleton' | 'card';
  message?: string;
  height?: string;
}

export function LoadingFallback({ 
  type = 'spinner', 
  message = 'Carregando...', 
  height = 'h-32' 
}: LoadingFallbackProps) {
  if (type === 'skeleton') {
    return (
      <div className={`space-y-4 ${height}`}>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (type === 'card') {
    return (
      <Card className={height}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`flex items-center justify-center ${height}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Componentes específicos para diferentes tipos de conteúdo
export function FormLoadingFallback() {
  return <LoadingFallback type="card" message="Carregando formulário..." height="h-96" />;
}

export function TableLoadingFallback() {
  return <LoadingFallback type="skeleton" height="h-64" />;
}

export function DashboardLoadingFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-32">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ComponentLoadingFallback() {
  return <LoadingFallback type="spinner" message="Carregando componente..." />;
}
