import { describe, it, expect } from "vitest";
import request from "supertest";
import { useDb, loginAs, seedRefs, createTenant, orderInput, app } from "./helpers";

useDb();

// Cairo 45 (whole governorate), Nasr City 35 (a city of Cairo, so it beats Cairo), Alexandria 70.
async function setup() {
  const refs = await seedRefs();
  const admin = await loginAs("admin");
  const cairo = (await admin.post("/zones").send({ name: "القاهرة الكبرى", price: 45, governorates: ["C"] })).body.data;
  const nasr = (await admin.post("/zones").send({ name: "مدينة نصر", price: 35, cities: ["C-NASR-CITY"] })).body.data;
  const alex = (await admin.post("/zones").send({ name: "الإسكندرية", price: 70, governorates: ["ALX"] })).body.data;
  return { ...refs, admin, cairo, nasr, alex };
}

const create = (agent: Awaited<ReturnType<typeof loginAs>>, merchant: string, place: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  agent.post("/orders").send(orderInput(merchant, { ...place, ...extra }));

describe("zones", () => {
  it("only admins manage zones; staff can list them and get quotes", async () => {
    const { cairo } = await setup();
    const employee = await loginAs("employee");
    expect((await employee.post("/zones").send({ name: "x", price: 1, governorates: ["GZ"] })).status).toBe(403);
    expect((await employee.put(`/zones/${cairo._id}`).send({ name: "x", price: 1, governorates: ["C"] })).status).toBe(403);
    expect((await employee.delete(`/zones/${cairo._id}`)).status).toBe(403);
    expect((await employee.get("/zones")).body.data.map((z: { name: string }) => z.name)).toHaveLength(3);
    expect((await employee.get("/zones/quote").query({ governorate: "C", city: "C-MAADI" })).body.data).toMatchObject({ zoneName: "القاهرة الكبرى", shippingFee: 45 });
  });

  it("validates places and refuses a governorate or city that is already in another zone", async () => {
    const { admin } = await setup();
    expect((await admin.post("/zones").send({ name: "Empty", price: 10 })).status).toBe(400);
    expect((await admin.post("/zones").send({ name: "Bad", price: 10, governorates: ["XX"] })).status).toBe(400);
    expect((await admin.post("/zones").send({ name: "Bad", price: 10, cities: ["C-ATLANTIS"] })).status).toBe(400);
    const overlap = await admin.post("/zones").send({ name: "Again", price: 10, governorates: ["ALX"], cities: ["C-NASR-CITY"] });
    expect(overlap.status).toBe(409);
    expect(overlap.body.error.code).toBe("ZONE_OVERLAP");
    expect(overlap.body.error.details).toHaveLength(2);
    expect((await admin.post("/zones").send({ name: "الإسكندرية", price: 1, governorates: ["GZ"] })).body.error.code).toBe("DUPLICATE");
  });

  it("a city's own zone beats its governorate's zone; places without a zone get no quote", async () => {
    const { admin } = await setup();
    const quote = async (q: Record<string, string>) => (await admin.get("/zones/quote").query(q)).body.data;
    expect(await quote({ governorate: "C", city: "C-NASR-CITY" })).toMatchObject({ zoneName: "مدينة نصر", shippingFee: 35 });
    expect(await quote({ governorate: "C", city: "C-MAADI" })).toMatchObject({ zoneName: "القاهرة الكبرى", shippingFee: 45 });
    expect(await quote({ governorate: "C" })).toMatchObject({ shippingFee: 45 });
    expect(await quote({ governorate: "SHG", city: "SHG-SOHAG" })).toEqual({ zone: null, zoneName: null, shippingFee: null });
    expect((await admin.get("/zones/quote").query({ governorate: "GZ", city: "C-MAADI" })).status).toBe(400);
  });

  it("zones are per tenant", async () => {
    await setup();
    const other = await createTenant("Other");
    const otherAdmin = await loginAs("admin", "admin@other.test", other);
    expect((await otherAdmin.get("/zones")).body.data).toEqual([]);
    expect((await otherAdmin.get("/zones/quote").query({ governorate: "C" })).body.data.shippingFee).toBeNull();
    // The same governorate can be zoned again in another tenant.
    expect((await otherAdmin.post("/zones").send({ name: "Cairo", price: 99, governorates: ["C"] })).status).toBe(201);
  });
});

describe("shipping price on orders", () => {
  it("is quoted on creation from the destination, with the merchant's own price when it has one", async () => {
    const { admin, merchant, cairo } = await setup();
    const a = await create(admin, merchant, { governorate: "C", city: "C-MAADI" });
    expect(a.body.data).toMatchObject({ governorate: "C", city: "C-MAADI", shippingFee: 45, zone: cairo._id });
    await admin.put(`/merchants/${merchant}/zone-prices`).send({ prices: [{ zone: cairo._id, price: 25 }] });
    expect((await create(admin, merchant, { governorate: "C", city: "C-MAADI" })).body.data.shippingFee).toBe(25);
    // Other zones keep their own price.
    expect((await create(admin, merchant, { governorate: "ALX", city: "ALX-SMOUHA" })).body.data.shippingFee).toBe(70);
    expect((await create(admin, merchant, { governorate: "SHG", city: "SHG-SOHAG" })).body.data).toMatchObject({ shippingFee: null, zone: null });
  });

  it("requires a governorate and one of its cities", async () => {
    const { admin, merchant } = await setup();
    expect((await admin.post("/orders").send({ ...orderInput(merchant), governorate: undefined, city: undefined })).status).toBe(400);
    expect((await create(admin, merchant, { governorate: "GZ", city: "C-NASR-CITY" })).status).toBe(400);
    expect((await create(admin, merchant, { governorate: "ZZ", city: "C-NASR-CITY" })).status).toBe(400);
  });

  it("only admins may set or change the price, and only until delivery", async () => {
    const { admin, merchant, courier } = await setup();
    const employee = await loginAs("employee");
    expect((await create(employee, merchant, { governorate: "C", city: "C-MAADI" }, { shippingFee: 1 })).status).toBe(403);
    const order = (await create(employee, merchant, { governorate: "C", city: "C-MAADI" })).body.data;
    expect(order.shippingFee).toBe(45);
    expect((await employee.patch(`/orders/${order._id}`).send({ shippingFee: 5 })).status).toBe(403);
    expect((await create(admin, merchant, { governorate: "C", city: "C-MAADI" }, { shippingFee: 60 })).body.data.shippingFee).toBe(60);

    expect((await admin.patch(`/orders/${order._id}`).send({ shippingFee: 50 })).body.data.shippingFee).toBe(50);
    await admin.patch(`/orders/${order._id}`).send({ courier, status: "with_courier" });
    await admin.patch(`/orders/${order._id}`).send({ status: "delivered" });
    const locked = await admin.patch(`/orders/${order._id}`).send({ shippingFee: 10 });
    expect(locked.status).toBe(409);
    expect(locked.body.error.code).toBe("SHIPPING_FEE_LOCKED");
  });

  it("the price becomes the company-fee snapshot at delivery (flat fee when there's no zone)", async () => {
    const { admin, merchant, courier } = await setup();
    const deliver = async (place: Record<string, string>) => {
      const o = (await create(admin, merchant, place, { courier })).body.data;
      return (await admin.patch(`/orders/${o._id}`).send({ status: "delivered" })).body.data.fees;
    };
    expect(await deliver({ governorate: "C", city: "C-NASR-CITY" })).toEqual({ courier: 20, company: 35 });
    expect(await deliver({ governorate: "SHG", city: "SHG-SOHAG" })).toEqual({ courier: 20, company: 10 });
    const summary = (await admin.get("/reports/summary").query({ archived: "all" })).body.data;
    expect(summary.money.companyCommission).toBe(45);
  });

  it("is re-quoted when the destination changes before delivery", async () => {
    const { admin, merchant } = await setup();
    const order = (await create(admin, merchant, { governorate: "C", city: "C-MAADI" })).body.data;
    const moved = (await admin.patch(`/orders/${order._id}`).send({ governorate: "ALX", city: "ALX-SMOUHA" })).body.data;
    expect(moved).toMatchObject({ governorate: "ALX", city: "ALX-SMOUHA", shippingFee: 70 });
    // A new governorate without a city clears the old city.
    const noCity = (await admin.patch(`/orders/${order._id}`).send({ governorate: "C" })).body.data;
    expect(noCity).toMatchObject({ governorate: "C", city: null, shippingFee: 45 });
    expect((await admin.patch(`/orders/${order._id}`).send({ city: "GZ-DOKKI" })).status).toBe(400);
  });

  it("orders can be filtered and reported by governorate and zone", async () => {
    const { admin, merchant, alex } = await setup();
    await create(admin, merchant, { governorate: "C", city: "C-MAADI" });
    await create(admin, merchant, { governorate: "C", city: "C-NASR-CITY" });
    await create(admin, merchant, { governorate: "ALX", city: "ALX-SMOUHA" });
    expect((await admin.get("/orders").query({ governorate: "C" })).body.meta.total).toBe(2);
    expect((await admin.get("/orders").query({ zone: alex._id })).body.meta.total).toBe(1);

    const byGov = (await admin.get("/reports/governorates").query({ archived: "all" })).body.data;
    expect(byGov.map((r: { governorate: { _id: string; name: string }; total: { count: number } }) => [r.governorate.name, r.total.count])).toEqual([
      ["الإسكندرية", 1],
      ["القاهرة", 2],
    ]);
    const byZone = (await admin.get("/reports/zones").query({ archived: "all" })).body.data;
    expect(byZone.map((r: { zone: { name: string }; total: { count: number } }) => [r.zone.name, r.total.count])).toEqual([
      ["الإسكندرية", 1],
      ["القاهرة الكبرى", 1],
      ["مدينة نصر", 1],
    ]);
    const employee = await loginAs("employee");
    expect((await employee.get("/reports/zones")).status).toBe(403);
  });

  it("deleting a zone keeps orders' prices and removes merchant prices for it", async () => {
    const { admin, merchant, alex } = await setup();
    await admin.put(`/merchants/${merchant}/zone-prices`).send({ prices: [{ zone: alex._id, price: 60 }] });
    const order = (await create(admin, merchant, { governorate: "ALX", city: "ALX-SMOUHA" })).body.data;
    expect((await admin.delete(`/zones/${alex._id}`)).status).toBe(200);
    expect((await admin.get(`/orders/${order._id}`)).body.data.shippingFee).toBe(60);
    const merchants = (await admin.get("/merchants")).body.data;
    expect(merchants[0].zonePrices).toEqual([]);
  });

  it("merchant prices accept only the tenant's zones", async () => {
    const { admin, merchant, cairo } = await setup();
    const other = await createTenant("Other");
    const otherAdmin = await loginAs("admin", "admin@other.test", other);
    const foreign = (await otherAdmin.post("/zones").send({ name: "X", price: 1, governorates: ["GZ"] })).body.data;
    expect((await admin.put(`/merchants/${merchant}/zone-prices`).send({ prices: [{ zone: foreign._id, price: 1 }] })).status).toBe(400);
    expect((await admin.put(`/merchants/${merchant}/zone-prices`).send({ prices: [{ zone: cairo._id, price: 1 }, { zone: cairo._id, price: 2 }] })).status).toBe(400);
    const employee = await loginAs("employee");
    expect((await employee.put(`/merchants/${merchant}/zone-prices`).send({ prices: [] })).status).toBe(403);
  });
});

describe("merchant API and portal", () => {
  it("the API accepts governorate / city codes, validates them, and prices the order", async () => {
    const { admin } = await setup();
    const key = (await admin.post("/merchants").send({ name: "Shop" })).body.data.apiKey;
    const send = (body: Record<string, unknown>) => request(app).post("/merchants/order").set("api-key", key).send({ fullName: "C", phone: "01001234567", address: "x", cost: 1, ...body });
    const ok = await send({ governorate: "ALX", city: "ALX-SMOUHA", reference: "A1" });
    expect(ok.status).toBe(201);
    expect(ok.body.data).toMatchObject({ governorate: "ALX", city: "ALX-SMOUHA", shippingFee: 70 });
    expect((await send({ governorate: "ALX", city: "C-MAADI" })).status).toBe(400);
    expect((await send({ city: "C-MAADI" })).status).toBe(400);
    expect((await send({ governorate: "NOPE" })).status).toBe(400);
    // Older integrations without places still work.
    expect((await send({ reference: "A2" })).body.data).toMatchObject({ governorate: null, shippingFee: null });
  });

  it("the public locations list has every governorate with city codes", async () => {
    const res = await request(app).get("/locations");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(27);
    expect(res.body.data.find((g: { code: string }) => g.code === "C").cities.some((c: { code: string }) => c.code === "C-NASR-CITY")).toBe(true);
  });

  it("merchants see their own price and can't set one", async () => {
    const { admin, merchant: merchantId, alex } = await setup();
    await admin.put(`/merchants/${merchantId}/zone-prices`).send({ prices: [{ zone: alex._id, price: 55 }] });
    await admin.post(`/merchants/${merchantId}/users`).send({ email: "shop@acme.test", password: "TempPassw0rd9" });
    const { User } = await import("../src/modules/users/user.model");
    await User.updateOne({ email: "shop@acme.test" }, { mustChangePassword: false }).setOptions({ skipTenantCheck: true });
    const merchant = request.agent(app);
    await merchant.post("/auth/login").send({ email: "shop@acme.test", password: "TempPassw0rd9" });

    expect((await merchant.get("/portal/quote").query({ governorate: "ALX", city: "ALX-SMOUHA" })).body.data).toEqual({ zoneName: "الإسكندرية", shippingFee: 55 });
    const input = { fullName: "C", phone: "01001234567", governorate: "ALX", city: "ALX-SMOUHA", address: "x", cost: 10 };
    expect((await merchant.post("/portal/orders").send({ ...input, shippingFee: 0 })).status).toBe(400);
    const created = await merchant.post("/portal/orders").send(input);
    expect(created.body.data.shippingFee).toBe(55);
    const listed = (await merchant.get("/portal/orders")).body.data[0];
    expect(listed).toMatchObject({ governorate: "ALX", city: "ALX-SMOUHA", shippingFee: 55 });
    expect(listed).not.toHaveProperty("zone");
  });
});
