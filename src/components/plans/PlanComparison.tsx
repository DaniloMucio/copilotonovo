'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Zap, Star } from 'lucide-react';
import { Plan } from '@/types/plans';

interface PlanComparisonProps {
  plans: Plan[];
  currentPlanId?: string;
}

export function PlanComparison({ plans, currentPlanId }: PlanComparisonProps) {
  const features = [
    { key: 'deliveries', label: 'Entregas por mês', type: 'number' as const },
    { key: 'reports', label: 'Relatórios por mês', type: 'number' as const },
    { key: 'support', label: 'Tipo de suporte', type: 'text' as const },
    { key: 'apiAccess', label: 'Acesso à API', type: 'boolean' as const },
    { key: 'customReports', label: 'Relatórios personalizados', type: 'boolean' as const },
  ];

  const getSupportLabel = (support: string) => {
    switch (support) {
      case 'email': return 'Email';
      case 'priority': return 'Prioritário';
      case '24/7': return '24/7';
      default: return support;
    }
  };

  const getFeatureValue = (plan: Plan, feature: typeof features[0]) => {
    const value = plan.limits[feature.key as keyof typeof plan.limits];
    
    if (feature.type === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    
    if (feature.type === 'number') {
      if (value === -1) return 'Ilimitado';
      return value?.toString() || '0';
    }
    
    if (feature.type === 'text') {
      return getSupportLabel(value as string);
    }
    
    return value?.toString() || '-';
  };

  const getFeatureIcon = (plan: Plan, feature: typeof features[0]) => {
    const value = plan.limits[feature.key as keyof typeof plan.limits];
    
    if (feature.type === 'boolean') {
      return value ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      );
    }
    
    return null;
  };

  const getPlanIcon = (plan: Plan) => {
    if (plan.type === 'enterprise') return <Crown className="h-5 w-5" />;
    if (plan.type === 'professional') return <Zap className="h-5 w-5" />;
    return <Star className="h-5 w-5" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-4 border-b">
              <span className="text-sm font-medium text-muted-foreground">Funcionalidades</span>
            </th>
            {plans.map((plan) => (
              <th key={plan.id} className="text-center p-4 border-b min-w-[200px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    {getPlanIcon(plan)}
                    <span className="font-semibold">{plan.name}</span>
                    {currentPlanId === plan.id && (
                      <Badge variant="secondary" className="text-xs">
                        Atual
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    {plan.price === 0 ? 'Gratuito' : `R$ ${plan.price.toFixed(2)}`}
                  </div>
                  <div className="text-sm text-muted-foreground">/mês</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.key} className="border-b">
              <td className="p-4 font-medium">{feature.label}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {getFeatureIcon(plan, feature)}
                    <span className="text-sm">
                      {getFeatureValue(plan, feature)}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
