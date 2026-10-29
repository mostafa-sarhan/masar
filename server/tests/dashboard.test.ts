import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { useDb, loginAs, seedRefs, orderInput, createTenant, UNSCOPED } from "./helpers";
import { Order } from "../src/modules/orders/order.model";

useDb();

async function setup() {
  const refs = await seedRefs();
  const admin = await loginAs("admin");
  const make = async (extra: Record<string, unknown> = {}) => (await admin.post("/orders").send(orderInput(refs.merchant, extra))).body.data;
  return { refs, admin, make };
}

describe("staff dashboard", () => {
  it("counts open work, today's results and each courier's progress", async () => {
    const { admin, make, refs } = await setup();
    await make(); // pending
    const a = await make({ courier: refs.courier, cost: 120 });
    const b = await make({ courier: refs.courier, cost: 80 });
    await make({ courier: refs.courier });
    await admin.patch(`/orders/${a._id}`).send({ status: "delivered" });
    await admin.patch(`/orders/${b._id}`).send({ status: "refused", reason: "Not home" });

    const d = (await admin.get("/dashboard")).body.data;
    expect(d.counts).toMatchObject({ pending: 1, with_courier: 1, delivered: 1, refused: 1 });
    expect(d.today).toEqual({ delivered: 1, returned: 0, refused: 1, cash: 120 });
    expect(d.couriers).toHaveLength(1);
    expect(d.couriers[0]).toMatchObject({ name: "Ali", open: 1, closedToday: 2, deliveredToday: 1, cashToday: 120 });
    expect(d.attention.map((o: { barcode: string }) => o.barcode)).toEqual([b.barcode]);
    expect(d.attention[0]).toMatchObject({ status: "refused", reason: "Not home", late: false });
  });

  it("flags orders stuck with a courier for 3+ days", async () => {
    const { admin, make, refs } = await setup();
    const o = await make({ courier: refs.courier });
    await Order.collection.updateOne({ _id: new mongoose.Types.ObjectId(o._id) }, { $set: { updatedAt: new Date(Date.now() - 4 * 86400e3) } });
    const d = (await admin.get("/dashboard")).body.data;
    expect(d.attention[0]).toMatchObject({ barcode: o.barcode, late: true, courier: { name: "Ali" } });
  });

  it("returns 7 days of deliveries in the tenant's timezone", async () => {
    const { admin, make, refs } = await setup();
    const o = await make({ courier: refs.courier });
    await admin.patch(`/orders/${o._id}`).send({ status: "delivered" });
    const week = (await admin.get("/dashboard")).body.data.week;
    expect(week).toHaveLength(7);
    expect(week[6].delivered).toBe(1);
    expect(week.slice(0, 6).every((d: { delivered: number }) => d.delivered === 0)).toBe(true);
    expect(week[6].day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("is staff-only and per tenant", async () => {
    const { make } = await setup();
    await make();
    const employee = await loginAs("employee");
    expect((await employee.get("/dashboard")).status).toBe(200);
    const other = await loginAs("admin", "x@other.test", await createTenant("Other"));
    expect((await other.get("/dashboard")).body.data.counts.pending).toBe(0);
    expect(await Order.countDocuments().setOptions(UNSCOPED)).toBe(1);
  });
});
