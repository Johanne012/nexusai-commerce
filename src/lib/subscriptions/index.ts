export type PlanId = "free" | "pro" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceXrp: number;
  priceUsd?: number;
  features: string[];
  maxAiGenerations: number;
  maxProducts: number;
  canUseMarketplace: boolean;
  canReceivePayouts: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "Perfect for trying NexusAI",
    priceXrp: 0,
    features: ["5 AI generations / month", "Basic digital products", "Community support"],
    maxAiGenerations: 5,
    maxProducts: 3,
    canUseMarketplace: false,
    canReceivePayouts: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For serious creators and sellers",
    priceXrp: 25,
    priceUsd: 15,
    features: ["200 AI generations / month", "Unlimited products", "Marketplace access", "Priority support", "XRP payouts"],
    maxAiGenerations: 200,
    maxProducts: 9999,
    canUseMarketplace: true,
    canReceivePayouts: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For agencies and high-volume users",
    priceXrp: 120,
    priceUsd: 79,
    features: ["Unlimited AI generations", "White-label options", "Dedicated escrow support", "Custom integrations", "API access", "Priority payouts"],
    maxAiGenerations: 999999,
    maxProducts: 999999,
    canUseMarketplace: true,
    canReceivePayouts: true,
  },
};

export function getPlan(planId: string): Plan {
  const plan = PLANS[planId as PlanId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  return plan;
}

export function calculatePeriodEnd(from: Date = new Date()): Date {
  const end = new Date(from);
  end.setMonth(end.getMonth() + 1);
  return end;
}

export function isSubscriptionActive(sub: { status: string; currentPeriodEnd: Date | string }): boolean {
  if (sub.status !== "ACTIVE") return false;
  return new Date(sub.currentPeriodEnd) > new Date();
}
