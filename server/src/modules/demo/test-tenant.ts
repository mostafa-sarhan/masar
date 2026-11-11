import mongoose from "mongoose";
import { Tenant } from "../tenants/tenant.model";
import { Order } from "../orders/order.model";
import { AuditEvent } from "../audit/audit-event.model";
import { Zone } from "../zones/zone.model";
import { Courier } from "../couriers/courier.model";
import { Merchant } from "../merchants/merchant.model";
import { User } from "../users/user.model";
import { RefreshToken } from "../auth/refresh-token.model";
import { PlatformAuditEvent } from "../platform/platform-audit-event.model";
import { withTransaction } from "../../lib/transaction";
import { seedCompany } from "./seed-company";

// A test company with sample data on a real instance (e.g. production), flagged isTest so it's never
// mistaken for a customer, and removable in one command. Accounts: <role>@masar-test.local.
export const TEST_TENANT = {
  name: "شركة مسار التجريبية",
  slug: "masar-test",
  emailDomain: "masar-test.local",
};

// Every collection holding a company's data (by tenantId). The platform's own audit log is kept.
const TENANT_DATA = [
  ["orders", Order],
  ["auditEvents", AuditEvent],
  ["zones", Zone],
  ["couriers", Courier],
  ["merchants", Merchant],
  ["users", User],
  ["refreshTokens", RefreshToken],
] as const;

export async function seedTestTenant(password: string, now = new Date()) {
  const existing = await Tenant.findOne({ slug: TEST_TENANT.slug }).lean();
  // The slug must never belong to a real company: only a test company is replaced.
  if (existing && !existing.isTest) throw new Error(`A company with slug "${TEST_TENANT.slug}" exists and is not a test company; nothing was changed`);
  const result = await seedCompany({ ...TEST_TENANT, password, now, orders: 150, days: 30, isTest: true, merchantApiKey: true });
  await PlatformAuditEvent.create({
    action: "SEED_TEST_TENANT",
    actor: { email: "script:seed-test-tenant" },
    target: { type: "tenant", id: result.tenant._id, label: result.tenant.name },
    changes: { orders: result.orders },
  });
  return result;
}

// What removing the test company would delete (nothing is deleted).
export async function planTestTenantRemoval(slug = TEST_TENANT.slug) {
  const tenant = await Tenant.findOne({ slug }).lean();
  if (!tenant) return { tenant: null, counts: null };
  if (!tenant.isTest) throw new Error(`"${slug}" is not a test company (isTest is not set); refusing to touch it`);
  const counts: Record<string, number> = {};
  for (const [name, model] of TENANT_DATA) counts[name] = await (model as mongoose.Model<unknown>).countDocuments({ tenantId: tenant._id });
  return { tenant, counts };
}

// Deletes the test company and all its data in one transaction (all or nothing).
export async function removeTestTenant(slug = TEST_TENANT.slug) {
  const plan = await planTestTenantRemoval(slug);
  if (!plan.tenant) return plan;
  const tenantId = plan.tenant._id;
  const deleted: Record<string, number> = {};
  await withTransaction(async () => {
    for (const [name, model] of TENANT_DATA) deleted[name] = (await (model as mongoose.Model<unknown>).deleteMany({ tenantId })).deletedCount;
    await Tenant.deleteOne({ _id: tenantId, isTest: true });
    await PlatformAuditEvent.create([
      { action: "REMOVE_TEST_TENANT", actor: { email: "script:remove-test-tenant" }, target: { type: "tenant", id: tenantId, label: plan.tenant!.name }, changes: deleted },
    ]);
  });
  return { tenant: plan.tenant, counts: deleted };
}
