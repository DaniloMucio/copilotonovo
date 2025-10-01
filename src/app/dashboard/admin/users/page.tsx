'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/AdminGuard';
import { UserManagement } from '@/components/admin/UserManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';

function UserManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-8 w-48" />
            <Skeleton className="h-4 w-64 sm:w-96" />
          </div>
        </div>
        <Skeleton className="h-10 w-full sm:w-32 sm:ml-auto" />
      </div>
      
      {/* Content Skeleton */}
      <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg animate-pulse"></div>
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 bg-white/50 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="ml-auto">
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserManagementPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
            <Users className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Gerencie todos os usuários do sistema - motoristas e clientes
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/admin')}
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 sm:ml-auto w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      <UserManagement />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <Suspense fallback={<UserManagementSkeleton />}>
        <UserManagementPage />
      </Suspense>
    </AdminGuard>
  );
}
