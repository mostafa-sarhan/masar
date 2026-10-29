export const PLANS = ["trial", "starter", "pro"] as const;
export type Plan = (typeof PLANS)[number];
export const TENANT_STATUSES = ["trial", "active", "suspended"] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

// null = unlimited
export const PLAN_LIMITS: Record<Plan, { maxUsers: number | null; maxOrdersPerMonth: number | null }> = {
  trial: { maxUsers: 5, maxOrdersPerMonth: 1000 },
  starter: { maxUsers: 10, maxOrdersPerMonth: 3000 },
  pro: { maxUsers: null, maxOrdersPerMonth: null },
};
export const TRIAL_DAYS = 14;

export const MERCHANT_DEDUCTIONS = ["company", "courier"] as const;
export type MerchantDeduction = (typeof MERCHANT_DEDUCTIONS)[number];
