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
import { Crown, BarChart3, Users, Zap, Car, Sparkles, DollarSign, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center space-x-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
          >
            <DollarSign className="h-4 w-4 text-white" />
          </motion.div>
          <Skeleton className="h-8 w-1/4" />
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * i }}
            >
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <DollarSign className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planos e Assinaturas</h1>
            <p className="text-gray-600">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Badge variant="outline" className="text-sm border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-300">
            <Crown className="h-4 w-4 mr-1" />
            Sistema de Planos
          </Badge>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-white/80 backdrop-blur-sm border-0 rounded-2xl shadow-lg p-1">
            <TabsTrigger 
              value="plans"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Planos Disponíveis</span>
              <span className="sm:hidden">Planos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="comparison"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Comparação</span>
              <span className="sm:hidden">Comparar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="status"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <span className="hidden sm:inline">Minha Assinatura</span>
              <span className="sm:hidden">Assinatura</span>
            </TabsTrigger>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  Por que escolher nossos planos?
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div 
                    className="text-center space-y-3 group/benefit"
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover/benefit:shadow-xl transition-all duration-300">
                      <BarChart3 className="h-8 w-8 text-white group-hover/benefit:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Relatórios Avançados</h3>
                    <p className="text-sm text-gray-600">
                      Acompanhe seu desempenho com relatórios detalhados
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="text-center space-y-3 group/benefit"
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover/benefit:shadow-xl transition-all duration-300">
                      <Users className="h-8 w-8 text-white group-hover/benefit:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Suporte Especializado</h3>
                    <p className="text-sm text-gray-600">
                      Suporte técnico dedicado para sua conta
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="text-center space-y-3 group/benefit"
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover/benefit:shadow-xl transition-all duration-300">
                      <Crown className="h-8 w-8 text-white group-hover/benefit:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Funcionalidades Premium</h3>
                    <p className="text-sm text-gray-600">
                      Acesso a recursos exclusivos e integrações
                    </p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Aba de Comparação */}
        <TabsContent value="comparison" className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-semibold text-gray-900">Compare os Planos</h2>
            <p className="text-gray-600">
              Veja todas as funcionalidades lado a lado
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-0 relative z-10">
                <PlanComparison 
                  plans={plans} 
                  currentPlanId={subscriptionStatus?.currentPlan?.id}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Aba de Status */}
        <TabsContent value="status" className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-semibold text-gray-900">Minha Assinatura</h2>
            <p className="text-gray-600">
              Gerencie sua assinatura e acompanhe seu uso
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="relative z-10">
                <SubscriptionStatus />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      </motion.div>
    </div>
  );
}
