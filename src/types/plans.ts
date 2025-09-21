export type PlanType = 'basic' | 'professional' | 'enterprise';

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  currency: 'BRL';
  interval: 'month' | 'year';
  features: string[];
  limits: {
    deliveries: number; // -1 para ilimitado
    reports: number;
    support: 'email' | 'priority' | '24/7';
    apiAccess: boolean;
    customReports: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Usage {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  deliveries: number;
  reports: number;
  lastReset: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanLimits {
  deliveries: number;
  reports: number;
  support: 'email' | 'priority' | '24/7';
  apiAccess: boolean;
  customReports: boolean;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  currentPlan: Plan | null;
  subscription: Subscription | null;
  usage: Usage | null;
  canUseFeature: (feature: keyof PlanLimits) => boolean;
  isWithinLimits: (feature: keyof PlanLimits, currentUsage: number) => boolean;
}
