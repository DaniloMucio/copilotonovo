
'use client';

import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Home, LogOut, Clock, Truck, Radio, Calendar } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useCallback } from 'react';
import { getUserDocument, type UserData } from '@/services/firestore';
import type { User } from 'firebase/auth';
import { RadioProvider } from '@/context/RadioContext';
import { usePWAInstall } from '@/hooks/use-pwa-install';

const motoristaNavItems = [
  { href: '/dashboard/motorista', label: 'Visão Geral', icon: Home },
  { href: '/dashboard/jornada', label: 'Jornada', icon: Clock },
  { href: '/dashboard/entregas', label: 'Entregas', icon: Truck },
  { href: '/dashboard/agenda', label: 'Agenda', icon: Calendar },
  { href: '/dashboard/radio', label: 'Rádio', icon: Radio },
];

const clienteNavItems = [
  { href: '/dashboard/cliente', label: 'Visão Geral', icon: Home },
  { href: '/dashboard/entregas', label: 'Entregas', icon: Truck },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [navItems, setNavItems] = useState<any[]>([]);
  const { canInstall, install, isClient } = usePWAInstall();

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao sair',
        description: 'Ocorreu um problema ao tentar fazer o logout.',
      });
    }
  }, [router, toast]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const doc = await getUserDocument(currentUser.uid);
        if (doc) {
          const simulatedMileage = 49500;
          const updatedUserData = { ...doc, currentMileage: simulatedMileage };
          setUserData(updatedUserData);

          if (doc.userType === 'motorista') {
            setNavItems(motoristaNavItems);
          } else if (doc.userType === 'cliente') {
            setNavItems(clienteNavItems);
          } else {
            handleLogout();
            toast({
              title: 'Acesso restrito',
              description: 'Apenas usuários autorizados podem acessar o dashboard.',
              variant: 'destructive',
            });
          }
        }
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router, toast, handleLogout]);

  const getDashboardHomeLink = () => {
    if (userData?.userType === 'motorista') {
      return '/dashboard/motorista';
    } else if (userData?.userType === 'cliente') {
      return '/dashboard/cliente';
    }
    return '/';
  }

  const getGridColsClass = () => {
    const totalItems = navItems.length + 1;
    switch (totalItems) {
      case 3:
        return 'grid-cols-3';
      case 6:
        return 'grid-cols-6';
      default:
        return `grid-cols-${totalItems}`;
    }
  };
  
  // Pass PWA props to child components (removido para evitar erros de tipo)
  const childrenWithPwaProps = children;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Desktop Header */}
      <header className="sticky top-0 hidden h-16 items-center gap-4 border-b bg-background px-6 md:flex">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href={getDashboardHomeLink()}
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Logo />
            <span className="sr-only">Co-Piloto Driver</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground font-semibold",
                pathname === item.href ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
           <div className="ml-auto flex-1 sm:flex-initial">
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
            </Button>
           </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:hidden">
        <Link href={getDashboardHomeLink()}>
            <Logo />
            <span className="sr-only">Co-Piloto Driver</span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {childrenWithPwaProps}
        <div className="h-16 md:hidden" />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 w-full border-t bg-background md:hidden">
        <div className={cn("grid h-16", getGridColsClass())}>
          {navItems.map((item) => (
             <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-muted",
                 pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="mb-1 h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
           <button
              onClick={handleLogout}
              className="inline-flex flex-col items-center justify-center px-5 text-muted-foreground hover:bg-muted"
            >
              <LogOut className="mb-1 h-6 w-6" />
              <span className="text-xs">Sair</span>
            </button>
        </div>
      </nav>
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
