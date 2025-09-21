'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanCard } from '@/components/plans/PlanCard';
import { PlanComparison } from '@/components/plans/PlanComparison';
import { SubscriptionStatus } from '@/components/plans/SubscriptionStatus';
import { getActivePlans, initializeDefaultPlans } from '@/services/plans';
import { useSubscription } from '@/hooks/use-subscription';
import { Plan } from '@/types/plans';
import { Crown, BarChart3, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FinanceiroPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { subscriptionStatus } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        
        // Inicializar planos padrão se não existirem
        await initializeDefaultPlans();
        
        // Carregar planos ativos
        const activePlans = await getActivePlans();
        setPlans(activePlans);
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar os planos disponíveis.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [toast]);

  const handlePlanSelect = (plan: Plan) => {
    // Recarregar a página para atualizar o status da assinatura
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planos e Assinaturas</h1>
          <p className="text-muted-foreground">
            Escolha o plano ideal para suas necessidades
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Crown className="h-4 w-4 mr-1" />
          Sistema de Planos
        </Badge>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Planos Disponíveis</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="status">Minha Assinatura</TabsTrigger>
        </TabsList>

        {/* Aba de Planos */}
        <TabsContent value="plans" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Escolha seu Plano</h2>
            <p className="text-muted-foreground">
              Todos os planos incluem 7 dias de teste gratuito
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isPopular={index === 1} // Plano profissional é o mais popular
                currentPlanId={subscriptionStatus?.currentPlan?.id}
                onSelect={handlePlanSelect}
              />
            ))}
          </div>

          {/* Benefícios dos Planos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Por que escolher nossos planos?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Relatórios Avançados</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe seu desempenho com relatórios detalhados
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Suporte Especializado</h3>
                  <p className="text-sm text-muted-foreground">
                    Suporte técnico dedicado para sua conta
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Funcionalidades Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    Acesso a recursos exclusivos e integrações
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Comparação */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Compare os Planos</h2>
            <p className="text-muted-foreground">
              Veja todas as funcionalidades lado a lado
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <PlanComparison 
                plans={plans} 
                currentPlanId={subscriptionStatus?.currentPlan?.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Status */}
        <TabsContent value="status" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Minha Assinatura</h2>
            <p className="text-muted-foreground">
              Gerencie sua assinatura e acompanhe seu uso
            </p>
          </div>

          <SubscriptionStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}
