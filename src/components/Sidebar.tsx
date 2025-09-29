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
  Settings,
  Menu,
  X,
  Shield,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { getUserDocument, UserData } from '@/services/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { OnlineStatusToggle } from './OnlineStatusToggle';
import { NotificationCenter } from './NotificationCenter';

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
    {
      name: 'Configurações',
      href: '/dashboard/configuracoes',
      icon: Settings,
      description: 'Perfil, senha e preferências'
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
    },
    {
      name: 'Configurações',
      href: '/dashboard/configuracoes',
      icon: Settings,
      description: 'Perfil, senha e preferências'
    }
  ];

  // Menu para administradores (apenas dashboard principal e configurações)
  const adminMenuItems = [
    {
      name: 'Dashboard Admin',
      href: '/dashboard/admin',
      icon: Shield,
      description: 'Painel administrativo principal'
    },
    {
      name: 'Configurações',
      href: '/dashboard/configuracoes',
      icon: Settings,
      description: 'Configurações do sistema'
    }
  ];

  // Selecionar menu baseado no tipo de usuário
  const getMenuItems = () => {
    if (userData?.userType === 'admin') {
      return adminMenuItems;
    } else if (userData?.userType === 'cliente') {
      return clienteMenuItems;
    } else {
      return motoristaMenuItems;
    }
  };
  
  const menuItems = getMenuItems();

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
    if (href === '/dashboard/admin') {
      return pathname === '/dashboard/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Botão do menu para dispositivos móveis otimizado */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-50 bg-white/95 backdrop-blur-sm border-2 hover:bg-white shadow-lg h-12 w-12 mobile-button"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        
        <SheetContent 
          side="left" 
          className="w-[90vw] max-w-sm p-0 bg-white border-r mobile-optimized"
          style={{ touchAction: 'pan-y' }}
        >
          <div className="flex flex-col h-full">
            {/* Header do menu lateral otimizado */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Menu Principal</h2>
              <div className="flex items-center gap-2">
                <NotificationCenter />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-10 w-10 mobile-button"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Toggle de status online/offline para motoristas */}
            <div className="px-4 py-3 border-b bg-gray-50">
              <OnlineStatusToggle />
            </div>
            
            {/* Lista de itens do menu otimizada */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-4 text-sm mobile-button",
                      "min-h-[48px]", // Touch target mínimo
                      isActive(item.href) && "bg-blue-600 text-white shadow-md"
                    )}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs opacity-80 truncate mt-1">{item.description}</div>
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
           <div className="flex items-center justify-between p-4 lg:p-6 border-b">
             <h2 className="text-lg lg:text-xl font-bold">Co-Piloto</h2>
             <NotificationCenter />
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
