import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { useDb, loginAs, createTenant, getTenant } from "./helpers";
import { Merchant } from "../src/modules/merchants/merchant.model";
import { migrations } from "../src/scripts/migrations";

useDb();

const names = (res: { body: { data: { name: string }[] } }) => res.body.data.map((m) => m.name);

describe("searchable option lists", () => {
  it("searches merchants the Arabic-aware way, word by word", async () => {
    const admin = await loginAs("admin");
    for (const name of ["متجر الإسكندرية", "مكتبة الشروق", "بيت العطور", "Nile Shop"]) await admin.post("/merchants").send({ name, withApiKey: false });
    expect(names(await admin.get("/merchants/options").query({ q: "الاسكندريه" }))).toEqual(["متجر الإسكندرية"]);
    expect(names(await admin.get("/merchants/options").query({ q: "شروق مكتبه" }))).toEqual(["مكتبة الشروق"]);
    expect(names(await admin.get("/merchants/options").query({ q: "NILE" }))).toEqual(["Nile Shop"]);
    expect(names(await admin.get("/merchants/options").query({ q: ".*" }))).toEqual([]); // regex characters are literal
    expect(await admin.get("/merchants/options").query({ limit: 2 }).then((r) => r.body.data.length)).toBe(2);
  });

  it("returns the labels of selected ids, and only the tenant's", async () => {
    const admin = await loginAs("admin");
    const a = (await admin.post("/couriers").send({ name: "كريم عادل" })).body.data;
    const other = await createTenant("Other");
    const foreign = await (await import("../src/modules/couriers/courier.model")).Courier.create({ tenantId: other._id, name: "غريب" });
    const res = await admin.get("/couriers/options").query({ ids: `${a._id},${foreign._id}` });
    expect(names(res)).toEqual(["كريم عادل"]);
    expect((await admin.get("/couriers/options").query({ ids: "not-an-id" })).status).toBe(400);
  });

  it("stays in sync when a merchant or courier is renamed", async () => {
    const admin = await loginAs("admin");
    const m = (await admin.post("/merchants").send({ name: "قديم", withApiKey: false })).body.data.merchant;
    await admin.patch(`/merchants/${m._id}`).send({ name: "متجر جديد" });
    expect(names(await admin.get("/merchants/options").query({ q: "جديد" }))).toEqual(["متجر جديد"]);
    const c = (await admin.post("/couriers").send({ name: "أحمد" })).body.data;
    await admin.patch(`/couriers/${c._id}`).send({ name: "مصطفى سعيد" });
    expect(names(await admin.get("/couriers/options").query({ q: "مصطفي" }))).toEqual(["مصطفى سعيد"]);
  });

  it("the migration backfills search names on existing data", async () => {
    const tenant = await getTenant();
    await mongoose.connection.db!.collection("merchants").insertOne({ tenantId: tenant._id, name: "الإسكندرية للتجارة" });
    const result = await migrations.find((m) => m.name === "search-names")!.run(mongoose.connection.db!);
    expect(result.updated).toBe(1);
    const doc = await Merchant.findOne({ tenantId: tenant._id }).select("+nameSearch").lean();
    expect(doc?.nameSearch).toBe("الاسكندريه للتجاره");
  });
});
