"use client";

import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import ErrorBoundary from './ErrorBoundary';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Service Worker é registrado automaticamente pelo Next.js PWA
  // Não é necessário registrar manualmente

  return (
    <ErrorBoundary showDetails={true}>
      <AuthProvider>
        <NotificationProvider>
          <div className="flex-grow flex flex-col">
            {children}
          </div>
          <Toaster />
          <OfflineIndicator />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
