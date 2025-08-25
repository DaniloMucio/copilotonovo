'use client';

import { useState } from 'react';
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

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
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
    }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
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
            className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header do menu lateral */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu Principal</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Lista de itens do menu */}
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-4",
                      isActive(item.href) && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs opacity-80">{item.description}</div>
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
          <div className="flex items-center p-6 border-b">
            <h2 className="text-xl font-bold">Co-Piloto</h2>
          </div>
          
          {/* Lista de itens do menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-4",
                    isActive(item.href) && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-80">{item.description}</div>
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
