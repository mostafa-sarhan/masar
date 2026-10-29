import type { ErrorCode } from "./errors";
import type { OrderStatus } from "./order-status";
import type { Role } from "./roles";
import type { Plan, TenantStatus, MerchantDeduction } from "./plans";

// Response envelope used by every endpoint.
export interface ApiSuccess<T, M = Record<string, unknown>> {
  data: T;
  meta?: M;
}
export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; details?: unknown; requestId?: string };
}

export interface PageMeta {
  total: number;
  page: number;
  pages: number;
}
export interface OrderPageMeta extends PageMeta {
  totalCost: number;
}

export interface Ref {
  _id: string;
  name: string;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  by?: { id?: string; email?: string; role?: string };
  reason?: string;
}

export interface Order {
  _id: string;
  barcode: string;
  trackingId: string;
  fullName: string;
  phone: string;
  address: string;
  cost: number;
  description?: string;
  reason?: string | null;
  status: OrderStatus;
  merchant: Ref | null;
  courier: Ref | null;
  merchantRef?: string;
  isArchived: boolean;
  deliveredAt: string | null;
  fees?: { courier: number; company: number } | null;
  statusHistory?: StatusEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface SessionTenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  status: TenantStatus;
  trialEndsAt: string | null;
  currency: string;
  timezone: string;
}

export interface TenantSettings {
  fees: { courier: number; company: number };
  merchantDeductions: MerchantDeduction[];
  archiveAfterDays: number;
  timezone: string;
  currency: string;
  labelName: string | null;
  logoUrl: string | null;
}

export interface Money {
  deliveredCount: number;
  deliveredTotal: number;
  courierCommission: number;
  companyCommission: number;
  afterCourier: number;
  merchantNet: number;
}
export interface Summary {
  total: { count: number; amount: number };
  byStatus: Partial<Record<OrderStatus, { count: number; amount: number }>>;
  money: Money;
}
export interface ReportMeta {
  fees: { courier: number; company: number };
}
