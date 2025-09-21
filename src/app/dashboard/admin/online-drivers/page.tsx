'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { getAllUsersWithStats, type UserWithStats } from '@/services/admin';
import { auth } from '@/lib/firebase';
import { getUserDocument, type UserData } from '@/services/firestore';

function OnlineDriversContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<UserWithStats[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<UserWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estado para seleção
  const [selectedDriver, setSelectedDriver] = useState<UserWithStats | null>(null);

  // Verificar autenticação e permissões
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getUserDocument(currentUser.uid);
        if (!userDoc) {
          console.log('Dados do usuário não encontrados no Firestore');
          await auth.signOut();
          router.push('/login');
          return;
        }

        if (userDoc.userType !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setUser(currentUser);
        setUserData(userDoc);
      } catch (error) {
        console.error('Erro ao verificar dados do usuário:', error);
        await auth.signOut();
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Carregar motoristas online
  const loadOnlineDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsersWithStats();
      
      // Filtrar apenas motoristas online
      const onlineDrivers = allUsers.filter(user => 
        user.userType === 'motorista' && user.isOnline === true
      );
      
      setDrivers(onlineDrivers);
      setFilteredDrivers(onlineDrivers);
    } catch (error) {
      console.error('Erro ao carregar motoristas online:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os motoristas online.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (userData?.userType === 'admin') {
      loadOnlineDrivers();
    }
  }, [userData, loadOnlineDrivers]);

  // Aplicar filtros e ordenação
  useEffect(() => {
    let filtered = drivers.filter(driver =>
      driver.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'lastActivity':
          comparison = new Date(a.lastActivity || 0).getTime() - new Date(b.lastActivity || 0).getTime();
          break;
        case 'deliveries':
          comparison = (a.totalDeliveries || 0) - (b.totalDeliveries || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredDrivers(filtered);
  }, [drivers, searchTerm, sortBy, sortOrder]);

  const handleDriverClick = (driver: UserWithStats) => {
    setSelectedDriver(driver);
  };


  const getStatusBadge = (driver: UserWithStats) => {
    return (
      <Badge variant={driver.isOnline ? "default" : "secondary"}>
        {driver.isOnline ? "Online" : "Offline"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Motoristas Online</h1>
            <p className="text-muted-foreground">Visualize e gerencie motoristas ativos</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Motoristas Online</h1>
            <p className="text-muted-foreground">
              {filteredDrivers.length} motorista(s) ativo(s) no momento
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={loadOnlineDrivers}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar motorista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="lastActivity">Última atividade</SelectItem>
                  <SelectItem value="deliveries">Entregas</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de motoristas */}
      <div className="space-y-3">
        {filteredDrivers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum motorista online</h3>
              <p className="text-muted-foreground">
                Não há motoristas ativos no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDrivers.map((driver) => (
            <Card 
              key={driver.uid}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedDriver?.uid === driver.uid ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleDriverClick(driver)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{driver.displayName}</h3>
                        {getStatusBadge(driver)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {driver.email}
                        </span>
                        {driver.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {driver.phone}
                          </span>
                        )}
                        {driver.lastActivity && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(driver.lastActivity, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <p className="font-medium">{driver.totalDeliveries || 0} entregas</p>
                      <p className="text-muted-foreground">
                        R$ {(driver.totalRevenue || 0).toFixed(2)}
                      </p>
                    </div>
                    
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}

function OnlineDriversSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function OnlineDriversPage() {
  return (
    <Suspense fallback={<OnlineDriversSkeleton />}>
      <OnlineDriversContent />
    </Suspense>
  );
}
