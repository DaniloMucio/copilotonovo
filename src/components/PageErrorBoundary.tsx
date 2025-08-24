"use client";

import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

const PageErrorFallback = ({ pageName }: { pageName?: string }) => (
  <div className="container mx-auto p-4">
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-destructive">Erro na página</CardTitle>
        <CardDescription>
          {pageName ? `Erro ao carregar a página "${pageName}"` : 'Erro ao carregar esta página'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Início
            </Link>
          </Button>
          <Button onClick={() => window.location.reload()} className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary 
      fallback={<PageErrorFallback pageName={pageName} />}
      showDetails={true}
    >
      {children}
    </ErrorBoundary>
  );
}
