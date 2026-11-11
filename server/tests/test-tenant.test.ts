import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { ORDER_STATUSES } from "@masar/shared";
import { useDb, app, createTenant, seedRefs, loginAs, loginPlatform, UNSCOPED } from "./helpers";
import { seedTestTenant, planTestTenantRemoval, removeTestTenant, TEST_TENANT } from "../src/modules/demo/test-tenant";
import { Tenant } from "../src/modules/tenants/tenant.model";
import { Order } from "../src/modules/orders/order.model";
import { Merchant } from "../src/modules/merchants/merchant.model";
import { User } from "../src/modules/users/user.model";
import { PlatformAuditEvent } from "../src/modules/platform/platform-audit-event.model";

useDb();

const NOW = new Date("2026-11-11T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

describe("test company on a real instance", () => {
  it("is a flagged pro company with 150 orders in every status over the last 30 days", async () => {
    const { tenant, orders } = await seedTestTenant("Test123456", NOW);
    expect(orders).toBe(150);
    const saved = await Tenant.findById(tenant._id).lean();
    expect(saved).toMatchObject({ name: "شركة مسار التجريبية", slug: "masar-test", plan: "pro", status: "active", isTest: true });

    const list = await Order.find({ tenantId: tenant._id }).select("status createdAt").lean();
    expect(new Set(list.map((o) => o.status))).toEqual(new Set(ORDER_STATUSES));
    const oldest = Math.min(...list.map((o) => o.createdAt.getTime()));
    expect(NOW.getTime() - oldest).toBeLessThanOrEqual(31 * DAY);
    expect(NOW.getTime() - oldest).toBeGreaterThan(21 * DAY);

    expect(await PlatformAuditEvent.countDocuments({ action: "SEED_TEST_TENANT" })).toBe(1);
  });

  it("every role logs in with the fixed password and no forced change", async () => {
    await seedTestTenant("Test123456", NOW);
    for (const role of ["owner", "admin", "employee", "courier", "merchant"]) {
      const res = await request(app).post("/auth/login").send({ email: `${role}@masar-test.local`, password: "Test123456" });
      expect(res.status, role).toBe(200);
      expect(res.body.data.user).toMatchObject({ role, mustChangePassword: false });
    }
  });

  it("the merchant's API key is returned once, stored hashed, and works", async () => {
    const { tenant, merchantApiKey } = await seedTestTenant("Test123456", NOW);
    expect(merchantApiKey).toMatch(/^mk_/);
    const merchantUser = await User.findOne({ tenantId: tenant._id, role: "merchant" }).lean();
    const merchant = await Merchant.findOne({ tenantId: tenant._id, _id: merchantUser!.merchantId }).select("+apiKeyHash").lean();
    expect(merchant!.apiKeyHash).not.toContain(merchantApiKey!);
    const res = await request(app)
      .post("/merchants/order")
      .set("api-key", merchantApiKey!)
      .send({ fullName: "عميل", phone: "01001234567", governorate: "C", city: "C-MAADI", address: "شارع 9", cost: 100 });
    expect(res.status).toBe(201);
  });

  it("platform admins see it in the company list, flagged as a test company", async () => {
    await seedTestTenant("Test123456", NOW);
    const admin = await loginPlatform();
    const tenants = (await admin.get("/platform/tenants")).body.data;
    expect(tenants.find((t: { slug: string }) => t.slug === "masar-test")).toMatchObject({ isTest: true, plan: "pro", status: "active" });
  });

  it("never replaces a real company that happens to use the slug", async () => {
    await createTenant("Real", { slug: TEST_TENANT.slug });
    await expect(seedTestTenant("Test123456", NOW)).rejects.toThrow(/not a test company/);
    expect(await Order.countDocuments({}).setOptions(UNSCOPED)).toBe(0);
  });
});

describe("removing the test company", () => {
  it("the dry run counts everything and deletes nothing", async () => {
    const { tenant } = await seedTestTenant("Test123456", NOW);
    const { counts } = await planTestTenantRemoval();
    expect(counts).toMatchObject({ orders: 150, users: 5, couriers: 6, merchants: 6, zones: 6 });
    expect(await Tenant.exists({ _id: tenant._id })).toBeTruthy();
    expect(await Order.countDocuments({ tenantId: tenant._id })).toBe(150);
  });

  it("deletes the company and all its data, and nothing of anyone else", async () => {
    const real = await createTenant("Real customer");
    await seedRefs(real);
    const realAdmin = await loginAs("admin", "admin@real.test", real);
    await realAdmin.post("/orders").send({ fullName: "C", phone: "01001234567", governorate: "C", city: "C-MAADI", address: "x", cost: 1, merchant: (await Merchant.findOne({ tenantId: real._id }))!._id.toString() });

    const { tenant } = await seedTestTenant("Test123456", NOW);
    const owner = request.agent(app);
    await owner.post("/auth/login").send({ email: "owner@masar-test.local", password: "Test123456" }); // leaves a session behind

    const { counts } = await removeTestTenant();
    expect(counts).toMatchObject({ orders: 150, users: 5, couriers: 6, merchants: 6, zones: 6 });
    expect(counts!.refreshTokens).toBeGreaterThan(0);
    for (const name of mongoose.modelNames()) {
      const model = mongoose.model(name);
      if (model.schema.path("tenantId")) expect(await model.countDocuments({ tenantId: tenant._id }).setOptions(UNSCOPED), name).toBe(0);
    }
    expect(await Tenant.exists({ _id: tenant._id })).toBeNull();
    expect((await request(app).post("/auth/login").send({ email: "owner@masar-test.local", password: "Test123456" })).status).toBe(401);
    expect((await owner.get("/auth/me")).status).toBe(401);

    // The real company is untouched.
    expect(await Order.countDocuments({ tenantId: real._id })).toBe(1);
    expect((await realAdmin.get("/orders")).body.meta.total).toBe(1);
    expect(await PlatformAuditEvent.countDocuments({ action: "REMOVE_TEST_TENANT" })).toBe(1);
  });

  it("refuses a company that isn't flagged as a test company", async () => {
    const real = await createTenant("Real", { slug: "real-co" });
    await seedRefs(real);
    await expect(planTestTenantRemoval("real-co")).rejects.toThrow(/not a test company/);
    await expect(removeTestTenant("real-co")).rejects.toThrow(/not a test company/);
    expect(await Tenant.exists({ _id: real._id })).toBeTruthy();
  });

  it("does nothing when there is no test company", async () => {
    expect(await removeTestTenant()).toEqual({ tenant: null, counts: null });
  });
});
