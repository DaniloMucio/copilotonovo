import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSubscriptionStatus, updateUsage } from '@/services/subscriptions';
import { SubscriptionStatus } from '@/types/plans';

export function useSubscription() {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptionStatus = async () => {
    if (!user) {
      setSubscriptionStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const status = await getSubscriptionStatus(user.uid);
      setSubscriptionStatus(status);
    } catch (err) {
      console.error('Erro ao carregar status da assinatura:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (feature: 'deliveries' | 'reports') => {
    if (!user) return;

    try {
      await updateUsage(user.uid, feature);
      // Recarregar status após atualizar uso
      await loadSubscriptionStatus();
    } catch (err) {
      console.error('Erro ao incrementar uso:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar uso');
    }
  };

  const canUseFeature = (feature: 'deliveries' | 'reports' | 'apiAccess' | 'customReports'): boolean => {
    if (!subscriptionStatus) return false;
    return subscriptionStatus.canUseFeature(feature);
  };

  const isWithinLimits = (feature: 'deliveries' | 'reports' | 'apiAccess' | 'customReports', currentUsage: number): boolean => {
    if (!subscriptionStatus) return false;
    return subscriptionStatus.isWithinLimits(feature, currentUsage);
  };

  const getRemainingUsage = (feature: 'deliveries' | 'reports'): number => {
    if (!subscriptionStatus?.currentPlan || !subscriptionStatus?.usage) return 0;
    
    const limit = subscriptionStatus.currentPlan.limits[feature];
    const current = subscriptionStatus.usage[feature] || 0;
    
    if (typeof limit === 'number') {
      if (limit === -1) return Infinity; // Ilimitado
      return Math.max(0, limit - current);
    }
    
    return 0;
  };

  const getUsagePercentage = (feature: 'deliveries' | 'reports'): number => {
    if (!subscriptionStatus?.currentPlan || !subscriptionStatus?.usage) return 0;
    
    const limit = subscriptionStatus.currentPlan.limits[feature];
    const current = subscriptionStatus.usage[feature] || 0;
    
    if (typeof limit === 'number') {
      if (limit === -1) return 0; // Ilimitado
      return Math.min(100, (current / limit) * 100);
    }
    
    return 0;
  };

  useEffect(() => {
    loadSubscriptionStatus();
  }, [user, loadSubscriptionStatus]);

  return {
    subscriptionStatus,
    loading,
    error,
    loadSubscriptionStatus,
    incrementUsage,
    canUseFeature,
    isWithinLimits,
    getRemainingUsage,
    getUsagePercentage
  };
}
