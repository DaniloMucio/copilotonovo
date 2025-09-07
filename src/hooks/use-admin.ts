import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserDocument, UserData } from '@/services/firestore';

export interface AdminHookReturn {
  isAdmin: boolean;
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

/**
 * Hook para verificar se o usuário atual é um administrador
 */
export const useAdmin = (): AdminHookReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const data = await getUserDocument(currentUser.uid);
        setUserData(data);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = userData?.userType === 'admin';

  return {
    isAdmin,
    user,
    userData,
    loading
  };
};

/**
 * Hook para verificar permissões específicas de administrador
 */
export const useAdminPermissions = () => {
  const { isAdmin, user, userData, loading } = useAdmin();

  const canManageUsers = isAdmin;
  const canViewAllData = isAdmin;
  const canManageSystem = isAdmin;
  const canViewReports = isAdmin;
  const canManageDeliveries = isAdmin;

  return {
    isAdmin,
    user,
    userData,
    loading,
    permissions: {
      canManageUsers,
      canViewAllData,
      canManageSystem,
      canViewReports,
      canManageDeliveries
    }
  };
};
