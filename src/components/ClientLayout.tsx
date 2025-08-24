"use client";

import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from './ErrorBoundary';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <ErrorBoundary showDetails={true}>
      <AuthProvider>
        <div className="flex-grow flex flex-col">
          {children}
        </div>
        <Toaster />
        <OfflineIndicator />
      </AuthProvider>
    </ErrorBoundary>
  );
}
