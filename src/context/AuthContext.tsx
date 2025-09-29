"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserDocument, UserData } from '@/services/firestore';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async (currentUser: any) => {
      setLoading(true);
      
      // Se não há usuário (logout), apenas limpar estado
      if (!currentUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }
      
      try {
        const data = await getUserDocument(currentUser.uid);
        
        if (!data) {
          // Se não encontrar dados do usuário, deslogar
          console.warn('⚠️ Usuário sem dados no Firestore - deslogando');
          await signOut(auth);
          setUser(null);
          setUserData(null);
          setLoading(false);
          return;
        }
        
        // Verificar se o usuário está ativo
        // REGRA: Apenas CLIENTES podem ser deslogados por inatividade
        // Admins e Motoristas sempre mantêm sessão ativa
        const isUserActive = data.userType === 'cliente' 
          ? data.isActive === true // Apenas clientes são deslogados quando inativos
          : true; // Admins e motoristas sempre mantêm sessão
        
        // Log apenas em desenvolvimento ou para casos problemáticos
        if (process.env.NODE_ENV === 'development' || !isUserActive) {
          console.log(`🔍 [CONTEXT] Verificando ${data.userType}: ${data.email}`);
          console.log(`🔍 [CONTEXT] isActive: ${data.isActive}, isOnline: ${data.isOnline}`);
          console.log(`🎯 [CONTEXT] Sessão ${isUserActive ? 'MANTIDA' : 'ENCERRADA'}`);
          
          if (data.userType === 'motorista') {
            console.log(`🚛 [CONTEXT] Motorista mantém sessão independente do status (inatividade só afeta entregas)`);
          }
        }
          
        if (!isUserActive) {
          // Usuário inativo - deslogar
          console.warn('⚠️ Usuário inativo detectado - deslogando');
          await signOut(auth);
          setUser(null);
          setUserData(null);
          setLoading(false);
          
          // Mostrar mensagem de usuário inativo
          showInactiveUserMessage();
          return;
        }
        
        setUser(currentUser);
        setUserData(data);
      } catch (error) {
        console.error('Erro ao verificar status do usuário:', error);
        // Em caso de erro, deslogar para segurança
        await signOut(auth);
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, checkUserStatus);

    // Listener para mudanças de status forçadas pelo admin
    const handleUserStatusChange = (event: CustomEvent) => {
      const { userId, isActive } = event.detail;
      if (user && user.uid === userId) {
        console.log(`🔄 [CONTEXT] Status do usuário atual foi alterado pelo admin: ${isActive}`);
        // Recarregar dados do usuário
        checkUserStatus(user);
      }
    };

    window.addEventListener('user-status-changed', handleUserStatusChange as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('user-status-changed', handleUserStatusChange as EventListener);
    };
  }, [user]);

  // Função para mostrar mensagem de usuário inativo
  const showInactiveUserMessage = () => {
    // Criar e mostrar toast personalizado com WhatsApp
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-inactive-user-alert');
      window.dispatchEvent(event);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
