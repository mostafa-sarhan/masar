import { Request } from "express";
import mongoose from "mongoose";
import { getCity, getGovernorate, type ZoneInput } from "@masar/shared";
import { Zone } from "./zone.model";
import { Merchant } from "../merchants/merchant.model";
import { recordAudit, diff } from "../audit/audit.service";
import { AppError, notFound } from "../../lib/errors";
import { scope } from "../../lib/scope";
import { withTransaction } from "../../lib/transaction";

export const listZones = (req: Request) => Zone.find(scope(req)).sort({ name: 1 }).lean();

// A governorate or city may belong to one zone only (a city may still sit inside another zone's governorate).
async function assertNoOverlap(req: Request, input: ZoneInput, exceptId?: string) {
  const unknownCities = input.cities.filter((c) => !getCity(c));
  if (unknownCities.length) throw new AppError(400, "VALIDATION_ERROR", "Unknown cities", unknownCities.map((c) => ({ path: "cities", message: c })));
  const others = await Zone.find({
    ...scope(req),
    ...(exceptId && { _id: { $ne: exceptId } }),
    $or: [{ governorates: { $in: input.governorates } }, { cities: { $in: input.cities } }],
  }).lean();
  const taken = others.flatMap((z) => [
    ...z.governorates.filter((g) => input.governorates.includes(g)).map((g) => ({ path: "governorates", message: `${getGovernorate(g)?.ar ?? g} في منطقة ${z.name}` })),
    ...z.cities.filter((c) => input.cities.includes(c)).map((c) => ({ path: "cities", message: `${getCity(c)?.ar ?? c} في منطقة ${z.name}` })),
  ]);
  if (taken.length) throw new AppError(409, "ZONE_OVERLAP", "Some places already belong to another zone", taken);
}

const zoneName409 = (err: unknown) => {
  if ((err as { code?: number })?.code === 11000) throw new AppError(409, "DUPLICATE", "A zone with this name already exists");
  throw err;
};

export async function createZone(req: Request, input: ZoneInput) {
  await assertNoOverlap(req, input);
  return withTransaction(async () => {
    const [zone] = await Zone.create([{ ...input, ...scope(req) }]).catch(zoneName409);
    await recordAudit(req, { entity: "zone", entityId: zone._id, action: "CREATE_ZONE", label: zone.name, changes: { price: { from: null, to: zone.price } } });
    return zone;
  });
}

export async function updateZone(req: Request, id: string, input: ZoneInput) {
  const zone = await Zone.findOne({ _id: id, ...scope(req) });
  if (!zone) throw notFound("Zone");
  await assertNoOverlap(req, input, id);
  return withTransaction(async () => {
    const before = { name: zone.name, price: zone.price, governorates: zone.governorates.join(","), cities: zone.cities.join(",") };
    zone.set(input);
    await zone.save().catch(zoneName409);
    const after = { name: zone.name, price: zone.price, governorates: zone.governorates.join(","), cities: zone.cities.join(",") };
    await recordAudit(req, { entity: "zone", entityId: zone._id, action: "UPDATE_ZONE", label: zone.name, changes: diff(before, after) });
    return zone;
  });
}

// Orders keep the zone id and fee they were priced with; merchant overrides for the zone are removed.
export async function deleteZone(req: Request, id: string) {
  await withTransaction(async () => {
    const zone = await Zone.findOneAndDelete({ _id: id, ...scope(req) });
    if (!zone) throw notFound("Zone");
    await Merchant.updateMany({ ...scope(req), "zonePrices.zone": zone._id }, { $pull: { zonePrices: { zone: zone._id } } });
    await recordAudit(req, { entity: "zone", entityId: zone._id, action: "DELETE_ZONE", label: zone.name });
  });
}

type ZoneLike = { _id: mongoose.Types.ObjectId; name: string; price: number; governorates: string[]; cities: string[] };
type MerchantPrices = { zone: mongoose.Types.ObjectId; price: number }[] | null | undefined;

// The zone a place falls in: a zone listing the city wins over one listing its governorate.
export function pickZone<Z extends ZoneLike>(zones: Z[], governorate: string | null | undefined, city: string | null | undefined): Z | null {
  if (!governorate) return null;
  return (city && zones.find((z) => z.cities.includes(city))) || zones.find((z) => z.governorates.includes(governorate)) || null;
}

// Shipping price for an order: the merchant's price for the zone, else the zone's price.
// No zone → no price (the tenant's flat company fee applies at delivery, as before zones).
export function priceFor(zones: ZoneLike[], merchantPrices: MerchantPrices, governorate?: string | null, city?: string | null) {
  const zone = pickZone(zones, governorate, city);
  if (!zone) return { zone: null, zoneName: null, shippingFee: null };
  const own = merchantPrices?.find((p) => p.zone.equals(zone._id));
  return { zone: zone._id, zoneName: zone.name, shippingFee: own ? own.price : zone.price };
}

// Loads only the zones that can match this place, and the merchant's prices.
export async function quoteShipping(tenantId: mongoose.Types.ObjectId, merchantId: string | mongoose.Types.ObjectId | null | undefined, governorate?: string | null, city?: string | null) {
  if (!governorate) return { zone: null, zoneName: null, shippingFee: null };
  const [zones, merchant] = await Promise.all([
    Zone.find({ tenantId, $or: [{ governorates: governorate }, ...(city ? [{ cities: city }] : [])] }).lean(),
    merchantId ? Merchant.findOne({ _id: merchantId, tenantId }).select("zonePrices").lean() : null,
  ]);
  return priceFor(zones, merchant?.zonePrices, governorate, city);
}
