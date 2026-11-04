import { describe, it, expect } from "vitest";
import request from "supertest";
import { useDb, app, createTenant, seedRefs } from "./helpers";
import { seedCompany } from "../src/modules/demo/seed-company";
import { Order } from "../src/modules/orders/order.model";
import { Merchant } from "../src/modules/merchants/merchant.model";
import { Tenant } from "../src/modules/tenants/tenant.model";
import { ORDER_STATUSES } from "@masar/shared";

useDb();

const opts = { name: "شركة تجريبية", slug: "demo", emailDomain: "masar-demo.test", password: "Test123456", now: new Date("2026-11-04T12:00:00Z") };

describe("seedCompany", () => {
  it("creates a usable company with one login per role and orders in every status", async () => {
    const { tenant, accounts, orders } = await seedCompany(opts);
    expect(orders).toBe(160);
    expect(accounts.map((a) => a.email)).toEqual(["owner@masar-demo.test", "admin@masar-demo.test", "employee@masar-demo.test", "courier@masar-demo.test", "merchant@masar-demo.test"]);

    const statuses = new Set((await Order.find({ tenantId: tenant._id }).select("status").lean()).map((o) => o.status));
    expect([...statuses].sort()).toEqual([...ORDER_STATUSES].sort());

    for (const { email, role } of accounts) {
      const agent = request.agent(app);
      const res = await agent.post("/auth/login").send({ email, password: "Test123456" });
      expect(res.status, email).toBe(200);
      expect(res.body.data.user.role).toBe(role);
    }

    const owner = request.agent(app);
    await owner.post("/auth/login").send({ email: "owner@masar-demo.test", password: "Test123456" });
    const summary = (await owner.get("/reports/summary").query({ archived: "all" })).body.data;
    expect(summary.total.count).toBe(160);
    expect(summary.money.companyCommission).toBeGreaterThan(0);
    expect((await owner.get("/zones")).body.data).toHaveLength(6);
    expect((await owner.get("/merchants/options").query({ q: "العطور" })).body.data).toHaveLength(1);

    const courier = request.agent(app);
    await courier.post("/auth/login").send({ email: "courier@masar-demo.test", password: "Test123456" });
    expect((await courier.get("/courier/orders")).status).toBe(200);
  });

  it("delivered orders carry a consistent fee snapshot and timeline", async () => {
    const { tenant } = await seedCompany(opts);
    const delivered = await Order.find({ tenantId: tenant._id, status: "delivered" }).lean();
    for (const o of delivered) {
      expect(o.fees?.company).toBe(o.shippingFee ?? 45);
      expect(o.statusHistory.at(-1)?.status).toBe("delivered");
      expect(o.deliveredAt).not.toBeNull();
    }
  });

  it("re-seeding replaces only that company, keeping its id", async () => {
    const other = await createTenant("Real company");
    await seedRefs(other);
    const first = await seedCompany(opts);
    const second = await seedCompany(opts);
    expect(String(second.tenant._id)).toBe(String(first.tenant._id));
    expect(await Order.countDocuments({ tenantId: first.tenant._id })).toBe(160);
    expect(await Merchant.countDocuments({ tenantId: other._id })).toBe(1);
    expect(await Tenant.countDocuments({})).toBe(2);
  });
});
