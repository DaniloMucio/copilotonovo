
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
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <header className="sticky top-0 h-16 border-b bg-background px-4 md:px-6 flex items-center justify-between">
          {/* Espaço vazio à esquerda para compensar o botão do menu */}
          <div className="w-12 md:w-16"></div>
          
          {/* Logo e nome centralizados */}
          <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
            <Logo />
            <span className="text-base md:text-lg font-semibold">Co-Piloto</span>
          </div>
          
          {/* Botão de logout à direita */}
          <Button onClick={handleLogout} variant="outline" size="sm" className="md:size-default">
            <LogOut className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </header>

        {/* Conteúdo */}
        <main className="flex flex-1 flex-col gap-4 p-3 md:gap-6 md:p-6 lg:gap-8 lg:p-8 min-w-0">
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
