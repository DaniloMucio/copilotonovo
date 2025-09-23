
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserDocument, UserData } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Car, Zap, Loader2 } from 'lucide-react';

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
      <div className="flex min-h-screen flex-col items-center justify-center p-4 relative">
        {/* Background Tech Elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse animation-delay-4000"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6 relative z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Car className="h-8 w-8 text-white" />
          </motion.div>
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Carregando Dashboard</h2>
            <p className="text-gray-600">Preparando sua experiência...</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-500">Conectando...</span>
          </div>
        </motion.div>
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
