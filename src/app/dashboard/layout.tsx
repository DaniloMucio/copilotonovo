
'use client';

import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { LogOut, Car, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback } from 'react';
import { getUserDocument, createBasicUserData, type UserData } from '@/services/firestore';
import type { User } from 'firebase/auth';
import { RadioProvider } from '@/context/RadioContext';
import { Sidebar } from '@/components/Sidebar';
import { useCacheCleanup } from '@/hooks/use-cache-cleanup';
import { motion } from 'framer-motion';

// Removido - não é mais necessário com o menu lateral

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { clearAllCaches } = useCacheCleanup();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      // Limpar todos os caches primeiro
      await clearAllCaches();
      
      // Fazer logout
      await auth.signOut();
      
      // Redirecionar para login imediatamente
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: 'Ocorreu um problema ao tentar fazer o logout.',
      });
    }
  }, [toast, clearAllCaches]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          let doc = await getUserDocument(currentUser.uid);
          
          if (!doc) {
            console.log('Dados do usuário não encontrados no Firestore');
            console.log('🔍 Verificando se o usuário foi excluído...');
            
            // Verificar se o usuário foi excluído (não criar dados automaticamente)
            console.log('❌ Usuário não encontrado no sistema - possivelmente foi excluído');
            console.log('🚫 Fazendo logout automático por segurança...');
            
            await auth.signOut();
            toast({
              title: 'Conta não encontrada',
              description: 'Sua conta não foi encontrada no sistema. Entre em contato com o administrador.',
              variant: 'destructive',
            });
            
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return;
          }
          
          if (doc) {
            const simulatedMileage = 49500;
            const updatedUserData = { ...doc, currentMileage: simulatedMileage };
            setUserData(updatedUserData);

            if (doc.userType !== 'motorista' && doc.userType !== 'cliente' && doc.userType !== 'admin') {
              console.log('Usuário sem permissão detectado, fazendo logout...');
              await auth.signOut();
              toast({
                title: 'Acesso restrito',
                description: 'Apenas usuários autorizados podem acessar o dashboard.',
                variant: 'destructive',
              });
            }
          }
        } else {
          // Redirecionar para login se não estiver autenticado
          console.log('Usuário não autenticado, redirecionando para login...');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Erro no onAuthStateChanged:', error);
        // Em caso de erro, fazer logout e redirecionar
        await auth.signOut();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    });
    return () => unsubscribe();
  }, [toast]);

  // Removido - não é mais necessário com o menu lateral

  // Removido - não é mais necessário com o menu lateral

    return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* Background Tech Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse animation-delay-4000"></div>
        
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="flex min-h-screen w-full relative z-10">
        {/* Menu Lateral */}
        <Sidebar />
        
        {/* Conteúdo Principal */}
        <div className="flex-1 lg:ml-64 min-w-0">
          {/* Header */}
          <header className="sticky top-0 h-16 border-b bg-white/90 backdrop-blur-xl border-gray-100 px-4 md:px-6 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
            
            {/* Logo e nome centralizados */}
            <motion.div 
              className="flex items-center gap-2 relative z-10"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
                <Car className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-base md:text-lg font-semibold text-gray-900">Co-Piloto Driver</span>
            </motion.div>
            
            {/* Botão de logout posicionado à direita */}
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="absolute right-4 md:right-6 z-10"
            >
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm" 
                className="md:size-default border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-4 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <LogOut className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </motion.div>
          </header>

          {/* Conteúdo */}
          <main className="flex flex-1 flex-col gap-4 p-3 md:gap-6 md:p-6 lg:gap-8 lg:p-8 min-w-0 relative z-10">
            {children}
          </main>
        </div>
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
