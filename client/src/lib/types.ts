// Client-side shapes of API responses (beyond the shared core types).
import type { OrderStatus, Role, Plan, TenantStatus, Summary } from "@masar/shared";

export type { Order, Ref, StatusEvent, SessionUser, SessionTenant, TenantSettings, Summary, Money, ReportMeta, OrderPageMeta, PageMeta, Zone, ShippingQuote } from "@masar/shared";

export interface Courier {
  _id: string;
  name: string;
  account: string | null;
}

export interface Merchant {
  _id: string;
  name: string;
  companyFee: number | null;
  apiKeyPrefix: string | null;
  hasActiveKey: boolean;
  apiKeyCreatedAt: string | null;
  apiKeyRevokedAt: string | null;
  createdAt: string;
  users?: string[];
  zonePrices?: { zone: string; price: number }[];
}

export interface UserRow {
  id: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface AuditEventRow {
  _id: string;
  entity: string;
  entityId: string;
  action: string;
  label?: string;
  actor?: { id?: string; email?: string };
  changes?: Record<string, { from: unknown; to: unknown }>;
  createdAt: string;
}

export type GroupedReportRow<K extends "merchant" | "courier" | "zone" | "governorate"> = Summary & { [P in K]: { _id: string; name: string | null } | null };

export interface CourierOrder {
  _id: string;
  barcode: string;
  fullName: string;
  phone: string;
  governorate?: string | null;
  city?: string | null;
  address: string;
  cost: number;
  description?: string;
  status: OrderStatus;
  reason?: string | null;
}

export interface CourierToday {
  open: number;
  delivered: number;
  returned: number;
  refused: number;
  cashToHandOver: number;
}

export interface PortalOrder {
  _id: string;
  barcode: string;
  trackingId: string;
  merchantRef?: string;
  fullName: string;
  phone: string;
  governorate?: string | null;
  city?: string | null;
  address: string;
  cost: number;
  shippingFee?: number | null;
  description?: string;
  status: OrderStatus;
  reason?: string | null;
  createdAt: string;
  statusHistory?: { status: OrderStatus; at: string; reason?: string }[];
}

export interface PortalStatement {
  total: { count: number; amount: number };
  byStatus: Summary["byStatus"];
  money: { deliveredCount: number; deliveredTotal: number; deductions: { company?: number; courier?: number }; merchantNet: number };
}

export interface TrackingResult {
  trackingId: string;
  status: OrderStatus;
  updatedAt: string;
  timeline: { status: OrderStatus; at: string }[];
  company: { name: string; logoUrl: string | null };
}

export interface TenantRow {
  _id: string;
  name: string;
  slug: string;
  plan: Plan;
  status: TenantStatus;
  trialEndsAt: string | null;
  limits: { maxUsers: number | null; maxOrdersPerMonth: number | null };
  createdAt: string;
}

export interface AccessRequestRow {
  _id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface PlatformAuditRow {
  _id: string;
  action: string;
  actor?: { email?: string };
  target?: { type?: string; label?: string };
  ip?: string;
  createdAt: string;
}

export interface ImportCheck {
  totalRows: number;
  validRows: number;
  errors: { row: number; field: string; message: string }[];
  preview?: { row: number; fullName: string; phone: string; governorateCode: string; cityCode: string; address: string; cost: number; merchant: string }[];
}
