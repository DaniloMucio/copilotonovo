
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserDocument, UserData } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const data = await getUserDocument(currentUser.uid);
          if (data) {
            if (data.userType === 'motorista') {
              router.replace('/dashboard/motorista');
            } else if (data.userType === 'cliente') {
              router.replace('/dashboard/cliente');
            } else if (data.userType === 'admin') {
              router.replace('/dashboard/admin');
            } else {
              console.warn("Tipo de usuário desconhecido. Redirecionando para o login.");
              router.push('/login');
            }
          } else {
            console.warn("Documento do usuário não encontrado no Firestore.");
            router.push('/login');
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 text-center">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
          </div>
      </div>
  );
}


export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <DashboardRedirect />
        </Suspense>
    )
}
