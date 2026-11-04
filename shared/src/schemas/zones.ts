import { z } from "zod";
import { objectId, str, money } from "../validators";
import { cityCode, governorateCode } from "./orders";

// A shipping zone: a group of whole governorates and/or single cities with one price.
export const zoneBody = z
  .object({
    name: str.short,
    price: money,
    governorates: z.array(governorateCode).max(27).default([]),
    cities: z.array(cityCode).max(500).default([]),
  })
  .strict()
  .refine((z) => z.governorates.length + z.cities.length > 0, { message: "Add at least one governorate or city", path: ["governorates"] });
export type ZoneInput = z.infer<typeof zoneBody>;

// A merchant's own prices per zone (replaces the whole list; empty = the zones' prices).
export const merchantZonePricesBody = z
  .object({ prices: z.array(z.object({ zone: objectId, price: money }).strict()).max(100) })
  .strict()
  .refine((b) => new Set(b.prices.map((p) => p.zone)).size === b.prices.length, { message: "A zone appears twice", path: ["prices"] });

export const shippingQuoteQuery = z
  .object({ merchant: objectId.optional(), governorate: governorateCode, city: cityCode.optional() })
  .superRefine((v, ctx) => {
    if (v.city && !v.city.startsWith(`${v.governorate}-`)) ctx.addIssue({ code: "custom", path: ["city"], message: "City is not in this governorate" });
  });
