'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { Plan } from '@/types/plans';
import { createSubscription } from '@/services/subscriptions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface PlanCardProps {
  plan: Plan;
  isPopular?: boolean;
  currentPlanId?: string;
  onSelect?: (plan: Plan) => void;
}

export function PlanCard({ plan, isPopular = false, currentPlanId, onSelect }: PlanCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isCurrentPlan = currentPlanId === plan.id;
  const isFree = plan.price === 0;

  const handleSelectPlan = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para assinar um plano.',
      });
      return;
    }

    if (isCurrentPlan) {
      toast({
        title: 'Plano Atual',
        description: 'Este já é o seu plano atual.',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Criar assinatura (simulado - sem pagamento real)
      await createSubscription(user.uid, plan.id, 7); // 7 dias de trial
      
      toast({
        title: 'Plano Selecionado!',
        description: `Você agora tem acesso ao ${plan.name}. Trial de 7 dias iniciado.`,
      });

      if (onSelect) {
        onSelect(plan);
      }
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível selecionar o plano. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = () => {
    if (isPopular) return <Star className="h-5 w-5" />;
    if (plan.type === 'enterprise') return <Crown className="h-5 w-5" />;
    if (plan.type === 'professional') return <Zap className="h-5 w-5" />;
    return <Check className="h-5 w-5" />;
  };

  const getPlanColor = () => {
    if (isPopular) return 'border-primary bg-primary/5';
    if (plan.type === 'enterprise') return 'border-purple-500 bg-purple-50';
    if (plan.type === 'professional') return 'border-blue-500 bg-blue-50';
    return 'border-muted';
  };

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-lg ${getPlanColor()} ${
      isCurrentPlan ? 'ring-2 ring-primary' : ''
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Star className="h-3 w-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary">
            Plano Atual
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          {getPlanIcon()}
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="text-base">
          {plan.type === 'basic' && 'Perfeito para começar'}
          {plan.type === 'professional' && 'Ideal para profissionais'}
          {plan.type === 'enterprise' && 'Solução completa para empresas'}
        </CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            {isFree ? 'Gratuito' : `R$ ${plan.price.toFixed(2)}`}
          </span>
          {!isFree && (
            <span className="text-muted-foreground">/mês</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4 border-t">
          <Button
            onClick={handleSelectPlan}
            disabled={isLoading || isCurrentPlan}
            className="w-full"
            variant={isCurrentPlan ? 'outline' : 'default'}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              getPlanIcon()
            )}
            <span className="ml-2">
              {isCurrentPlan ? 'Plano Atual' : isFree ? 'Começar Grátis' : 'Assinar Agora'}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
