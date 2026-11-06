import { describe, it, expect, vi } from "vitest";

vi.hoisted(() => {
  Object.assign(process.env, { DEMO_MODE: "true", DEMO_TENANT_SLUG: "demo", DEMO_WHATSAPP: "+20 100 123 4567", RATE_LIMIT_LOGIN_IP_PER_15MIN: "1000" });
});

import request from "supertest";
import { useDb, app, loginAs, createTenant } from "./helpers";
import { resetDemo } from "../src/modules/demo/demo.service";
import { Order } from "../src/modules/orders/order.model";
import { Tenant } from "../src/modules/tenants/tenant.model";

useDb();

async function demoAs(role: string) {
  const agent = request.agent(app);
  const res = await agent.post("/demo/login").send({ role });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return agent;
}

describe("demo mode", () => {
  it("tells the client it's on, with the WhatsApp number and reset schedule", async () => {
    await resetDemo(new Date("2026-11-06T10:00:00Z"));
    const res = await request(app).get("/demo");
    expect(res.body.data).toMatchObject({ enabled: true, roles: ["owner", "admin", "employee", "courier", "merchant"], whatsapp: "201001234567", resetMinutes: 60 });
    expect(res.body.data.nextResetAt).toBe("2026-11-06T11:00:00.000Z");
  });

  it("logs in as every role in one click, flagged as the demo company", async () => {
    await resetDemo();
    for (const role of ["owner", "admin", "employee", "courier", "merchant"]) {
      const agent = await demoAs(role);
      const me = (await agent.get("/auth/me")).body.data;
      expect(me.user.role).toBe(role);
      expect(me.tenant.demo).toBe(true);
    }
    expect((await request(app).post("/demo/login").send({ role: "platform_admin" })).status).toBe(400);
  });

  it("blocks new logins, password and role changes, and API keys in the demo company", async () => {
    await resetDemo();
    const owner = await demoAs("owner");
    const blocked = async (res: request.Response) => {
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("DEMO_DISABLED");
    };
    await blocked(await owner.post("/auth/change-password").send({ currentPassword: "x", newPassword: "Another-Pass-2026" }));
    await blocked(await owner.post("/users").send({ email: "new@x.test", password: "Str0ngPassw0rd", role: "employee" }));
    const users = (await owner.get("/users")).body.data as { id: string; role: string }[];
    const employee = users.find((u) => u.role === "employee")!;
    await blocked(await owner.put(`/users/${employee.id}/password`).send({ newPassword: "Str0ngPassw0rd" }));
    await blocked(await owner.put(`/users/${employee.id}/role`).send({ role: "admin" }));
    const courier = (await owner.get("/couriers")).body.data[1];
    await blocked(await owner.post(`/couriers/${courier._id}/account`).send({ email: "c2@x.test", password: "Str0ngPassw0rd" }));
    const merchant = (await owner.get("/merchants")).body.data[0];
    await blocked(await owner.post(`/merchants/${merchant._id}/api-key`));
    await blocked(await owner.post(`/merchants/${merchant._id}/users`).send({ email: "m2@x.test", password: "Str0ngPassw0rd" }));
    // A new merchant is allowed, but never gets an API key.
    const created = await owner.post("/merchants").send({ name: "متجر جديد" });
    expect(created.status).toBe(201);
    expect(created.body.data.apiKey).toBeNull();

    const portal = await demoAs("merchant");
    await blocked(await portal.post("/portal/api-key"));
    // Everyday work still works.
    expect((await owner.get("/orders")).status).toBe(200);
  });

  it("real companies are not affected", async () => {
    await resetDemo();
    const real = await createTenant("Real");
    const admin = await loginAs("admin", "admin@real.test", real);
    expect((await admin.get("/auth/me")).body.data.tenant.demo).toBe(false);
    expect((await admin.post("/users").send({ email: "e@real.test", password: "Str0ngPassw0rd", role: "employee" })).status).toBe(201);
    // A demo reset leaves the real company and its users alone.
    await resetDemo();
    expect(await Tenant.countDocuments({})).toBe(2);
    expect((await admin.get("/users")).body.data).toHaveLength(2);
  });

  it("a reset restores the data and keeps visitors signed in", async () => {
    const { tenant } = await resetDemo();
    const owner = await demoAs("owner");
    const order = (await owner.get("/orders")).body.data[0];
    await owner.delete(`/orders/${order._id}`);
    expect(await Order.countDocuments({ tenantId: tenant._id })).toBe(159);

    await resetDemo();
    expect(await Order.countDocuments({ tenantId: tenant._id })).toBe(160);
    expect((await owner.get("/auth/me")).status).toBe(200);
    expect((await owner.post("/auth/refresh")).status).toBe(200);
  });
});
