'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  DollarSign, 
  Car, 
  Clock, 
  Package, 
  Calendar, 
  Radio,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { getUserDocument, UserData } from '@/services/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { OnlineStatusToggle } from './OnlineStatusToggle';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Buscar dados do usuário para determinar o tipo
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const data = await getUserDocument(currentUser.uid);
        setUserData(data);
      }
    });

    return () => unsubscribe();
  }, []);

  // Menu para motoristas
  const motoristaMenuItems = [
    {
      name: 'Visão Geral',
      href: '/dashboard',
      icon: Home,
      description: 'Resumo geral das atividades'
    },
    {
      name: 'Financeiro',
      href: '/dashboard/financeiro',
      icon: DollarSign,
      description: 'Gestão financeira e relatórios'
    },
    {
      name: 'Veículo',
      href: '/dashboard/veiculo',
      icon: Car,
      description: 'Controle de manutenção e combustível'
    },
    {
      name: 'Jornada',
      href: '/dashboard/jornada',
      icon: Clock,
      description: 'Controle de horas trabalhadas'
    },
    {
      name: 'Entregas',
      href: '/dashboard/entregas',
      icon: Package,
      description: 'Gestão de entregas e fretes'
    },
    {
      name: 'Agenda',
      href: '/dashboard/agenda',
      icon: Calendar,
      description: 'Agendamentos e compromissos'
    },
    {
      name: 'Rádio',
      href: '/dashboard/radio',
      icon: Radio,
      description: 'Estações de rádio online'
    },

  ];

  // Menu para clientes (apenas as funcionalidades solicitadas)
  const clienteMenuItems = [
    {
      name: 'Visão Geral',
      href: '/dashboard/cliente',
      icon: Home,
      description: 'Resumo geral das atividades'
    },
    {
      name: 'Entregas',
      href: '/dashboard/cliente/entregas',
      icon: Package,
      description: 'Acompanhamento de entregas'
    },
    {
      name: 'Agenda',
      href: '/dashboard/cliente/agenda',
      icon: Calendar,
      description: 'Agendamentos e compromissos'
    }
  ];

  // Selecionar menu baseado no tipo de usuário
  const menuItems = userData?.userType === 'cliente' ? clienteMenuItems : motoristaMenuItems;

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '/dashboard/cliente') {
      return pathname === '/dashboard/cliente';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Botão do menu para dispositivos móveis */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-50 bg-background/95 backdrop-blur-sm border-2 hover:bg-background shadow-lg h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
          <div className="flex flex-col h-full">
            {/* Header do menu lateral */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b">
              <h2 className="text-base md:text-lg font-semibold">Menu Principal</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Toggle de status online/offline para motoristas */}
            <div className="px-3 py-2 border-b">
              <OnlineStatusToggle />
            </div>
            
            {/* Lista de itens do menu */}
            <nav className="flex-1 p-3 md:p-4 space-y-1 md:space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-3 md:p-4 text-sm md:text-base",
                      isActive(item.href) && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs opacity-80 truncate">{item.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

             {/* Menu lateral fixo para desktop */}
       <div className={cn(
         "hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-background lg:border-r",
         className
       )}>
         <div className="flex flex-col h-full">
           {/* Header do menu lateral */}
           <div className="flex items-center p-4 lg:p-6 border-b">
             <h2 className="text-lg lg:text-xl font-bold">Co-Piloto</h2>
           </div>
           
           {/* Toggle de status online/offline para motoristas */}
           <div className="px-4 py-2 border-b">
             <OnlineStatusToggle />
           </div>
           
           {/* Lista de itens do menu */}
           <nav className="flex-1 p-3 lg:p-4 space-y-1 lg:space-y-2">
             {menuItems.map((item) => {
               const Icon = item.icon;
               return (
                 <Button
                   key={item.href}
                   variant={isActive(item.href) ? "default" : "ghost"}
                   className={cn(
                     "w-full justify-start h-auto p-3 lg:p-4 text-sm lg:text-base",
                     isActive(item.href) && "bg-primary text-primary-foreground"
                   )}
                   onClick={() => handleNavigation(item.href)}
                 >
                   <div className="flex items-center space-x-2 lg:space-x-3">
                     <Icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                     <div className="text-left min-w-0 flex-1">
                       <div className="font-medium truncate">{item.name}</div>
                       <div className="text-xs opacity-80 truncate">{item.description}</div>
                     </div>
                   </div>
                 </Button>
               );
             })}
           </nav>
         </div>
       </div>
    </>
  );
}
