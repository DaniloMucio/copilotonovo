'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, Calendar, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export function SubscriptionStatus() {
  const { subscriptionStatus, loading, error } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Erro ao carregar status da assinatura</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionStatus?.hasActiveSubscription) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Nenhuma Assinatura Ativa
          </CardTitle>
          <CardDescription>
            Você não possui uma assinatura ativa. Escolha um plano para acessar todas as funcionalidades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/planos">
              <Crown className="h-4 w-4 mr-2" />
              Ver Planos Disponíveis
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { currentPlan, subscription, usage } = subscriptionStatus;
  const isTrial = subscription?.status === 'trial';
  const isActive = subscription?.status === 'active';

  const getStatusBadge = () => {
    if (isTrial) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Trial</Badge>;
    }
    if (isActive) {
      return <Badge variant="default" className="text-green-600 border-green-600">Ativo</Badge>;
    }
    return <Badge variant="destructive">Inativo</Badge>;
  };

  const getStatusIcon = () => {
    if (isTrial) return <Zap className="h-4 w-4 text-orange-600" />;
    if (isActive) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Status da Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Status da Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{currentPlan?.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan?.price === 0 ? 'Gratuito' : `R$ ${currentPlan?.price.toFixed(2)}/mês`}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {subscription && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Início</p>
                <p className="font-medium">
                  {format(subscription.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {isTrial ? 'Trial até' : 'Próxima cobrança'}
                </p>
                <p className="font-medium">
                  {isTrial && subscription.trialEndDate
                    ? format(subscription.trialEndDate, 'dd/MM/yyyy', { locale: ptBR })
                    : format(subscription.endDate, 'dd/MM/yyyy', { locale: ptBR })
                  }
                </p>
              </div>
            </div>
          )}

          {isTrial && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Período de teste ativo!</strong> Você tem acesso completo às funcionalidades do plano.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uso Atual */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Uso Este Mês</CardTitle>
            <CardDescription>
              Acompanhe seu uso em relação aos limites do seu plano
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Entregas */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Entregas</span>
                <span>
                  {usage.deliveries} / {currentPlan?.limits.deliveries === -1 ? '∞' : currentPlan?.limits.deliveries}
                </span>
              </div>
              {currentPlan?.limits.deliveries !== -1 && (
                <Progress
                  value={(usage.deliveries / (currentPlan?.limits.deliveries || 1)) * 100}
                  className="h-2"
                />
              )}
            </div>

            {/* Relatórios */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Relatórios</span>
                <span>
                  {usage.reports} / {currentPlan?.limits.reports === -1 ? '∞' : currentPlan?.limits.reports}
                </span>
              </div>
              {currentPlan?.limits.reports !== -1 && (
                <Progress 
                  value={(usage.reports / (currentPlan?.limits.reports || 1)) * 100} 
                  className="h-2"
                />
              )}
            </div>

            {/* Funcionalidades Premium */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Funcionalidades Premium</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {currentPlan?.limits.apiAccess ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Acesso à API</span>
                </div>
                <div className="flex items-center gap-2">
                  {currentPlan?.limits.customReports ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Relatórios Personalizados</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard/planos">
            <Crown className="h-4 w-4 mr-2" />
            Gerenciar Plano
          </Link>
        </Button>
        {isTrial && (
          <Button asChild>
            <Link href="/dashboard/planos">
              Ativar Assinatura
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
