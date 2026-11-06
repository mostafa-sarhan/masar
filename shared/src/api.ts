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
  // Destination (codes from the shared location list; null on orders created before locations).
  governorate?: string | null;
  city?: string | null;
  zone?: Ref | null;
  // Quoted shipping price (null = no zone matched; the flat company fee applies at delivery).
  shippingFee?: number | null;
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
  // The demo company (demo mode): shows the demo banner; some actions are disabled.
  demo?: boolean;
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

// GET /dashboard (staff)
export interface DashboardOverview {
  counts: Record<OrderStatus, number>;
  today: { delivered: number; returned: number; refused: number; cash: number };
  couriers: { _id: string; name: string | null; open: number; closedToday: number; deliveredToday: number; cashToday: number }[];
  attention: {
    _id: string;
    barcode: string;
    fullName: string;
    address: string;
    status: OrderStatus;
    reason: string | null;
    courier: Ref | null;
    updatedAt: string;
    late: boolean;
  }[];
  week: { day: string; delivered: number }[];
}

export interface Zone {
  _id: string;
  name: string;
  price: number;
  governorates: string[];
  cities: string[];
}

export interface ShippingQuote {
  zone: string | null;
  zoneName: string | null;
  shippingFee: number | null;
}
