
'use client';

import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback } from 'react';
import { getUserDocument, type UserData } from '@/services/firestore';
import type { User } from 'firebase/auth';
import { RadioProvider } from '@/context/RadioContext';
import { Sidebar } from '@/components/Sidebar';

// Removido - não é mais necessário com o menu lateral

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: 'Ocorreu um problema ao tentar fazer o logout.',
      });
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const doc = await getUserDocument(currentUser.uid);
        if (doc) {
          const simulatedMileage = 49500;
          const updatedUserData = { ...doc, currentMileage: simulatedMileage };
          setUserData(updatedUserData);

          if (doc.userType !== 'motorista' && doc.userType !== 'cliente') {
            handleLogout();
            toast({
              title: 'Acesso restrito',
              description: 'Apenas usuários autorizados podem acessar o dashboard.',
              variant: 'destructive',
            });
          }
        }
      } else {
        // Redirecionar para login se não estiver autenticado
        window.location.href = '/';
      }
    });
    return () => unsubscribe();
  }, [toast, handleLogout]);

  // Removido - não é mais necessário com o menu lateral

  // Removido - não é mais necessário com o menu lateral

    return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Menu Lateral */}
      <Sidebar />
      
      {/* Conteúdo Principal */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 h-16 border-b bg-background px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-semibold">Co-Piloto</span>
          </div>
          
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </header>

        {/* Conteúdo */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RadioProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </RadioProvider>
  )
}
