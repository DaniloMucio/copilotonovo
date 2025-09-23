'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getUserDocument, type UserData } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SettingsManager } from '@/components/SettingsManager';
import { Settings, Sparkles } from 'lucide-react';

function ConfiguracoesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
          <Settings className="h-4 w-4 text-white" />
        </div>
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function ConfiguracoesContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserData = useCallback(async (uid: string) => {
    try {
      const data = await getUserDocument(uid);
      if (data) {
        setUserData(data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os dados do usuário.'
      });
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, fetchUserData]);

  if (loading) {
    return <ConfiguracoesSkeleton />;
  }

  if (!user || !userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Usuário não encontrado</h2>
          <p className="text-muted-foreground mt-2">Não foi possível carregar os dados do usuário.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
            <Settings className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configurações</h1>
            <p className="text-gray-600">
              Gerencie seu perfil, preferências e configurações da conta.
            </p>
          </div>
        </div>
        <div>
          <Badge variant="outline" className="text-sm font-medium capitalize border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-300">
            {userData.userType}
          </Badge>
        </div>
      </div>

      {/* Gerenciador de Configurações */}
      <div>
        <SettingsManager user={user} userData={userData} />
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<ConfiguracoesSkeleton />}>
      <ConfiguracoesContent />
    </Suspense>
  );
}
