'use client';

import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, Zap } from 'lucide-react';
import Link from 'next/link';

interface PlanGuardProps {
  children: ReactNode;
  requiredFeature: 'deliveries' | 'reports' | 'apiAccess' | 'customReports';
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export function PlanGuard({ 
  children, 
  requiredFeature, 
  fallback,
  showUpgrade = true 
}: PlanGuardProps) {
  const { subscriptionStatus, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscriptionStatus?.hasActiveSubscription) {
    return fallback || (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Assinatura Necessária</CardTitle>
          <CardDescription>
            Esta funcionalidade requer uma assinatura ativa. Escolha um plano para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/dashboard/planos">
              <Crown className="h-4 w-4 mr-2" />
              Ver Planos
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canUse = subscriptionStatus.canUseFeature(requiredFeature);

  if (!canUse) {
    return fallback || (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Zap className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Limite Atingido</CardTitle>
          <CardDescription>
            Você atingiu o limite do seu plano atual para esta funcionalidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Plano atual:</span>
            <Badge variant="outline">{subscriptionStatus.currentPlan?.name}</Badge>
          </div>
          {showUpgrade && (
            <Button asChild>
              <Link href="/dashboard/planos">
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

// Componente para mostrar informações de uso
export function UsageInfo({ feature }: { feature: 'deliveries' | 'reports' }) {
  const { subscriptionStatus, getRemainingUsage, getUsagePercentage } = useSubscription();

  if (!subscriptionStatus?.currentPlan || !subscriptionStatus?.usage) {
    return null;
  }

  const remaining = getRemainingUsage(feature);
  const percentage = getUsagePercentage(feature);
  const limit = subscriptionStatus.currentPlan.limits[feature];
  const current = subscriptionStatus.usage[feature] || 0;

  if (typeof limit !== 'number' || limit === -1) {
    return (
      <div className="text-sm text-muted-foreground">
        {feature === 'deliveries' ? 'Entregas' : 'Relatórios'}: Ilimitado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {feature === 'deliveries' ? 'Entregas' : 'Relatórios'} usadas
        </span>
        <span>{current} / {limit}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {remaining} restantes este mês
      </div>
    </div>
  );
}
