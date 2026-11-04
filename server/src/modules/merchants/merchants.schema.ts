import { z } from "zod";
import { str, money } from "../../lib/validate";
import { governorateCode, cityCode, cityInGovernorate } from "@masar/shared";
export { merchantZonePricesBody } from "@masar/shared";

// Portal login for a merchant (several per merchant allowed). One-time password.
export const merchantUserBody = z.object({ email: str.email, password: z.string().max(200) }).strict();

export const createMerchantBody = z.object({ name: str.name, withApiKey: z.boolean().default(true) }).strict();
export const updateMerchantBody = z
  .object({ name: str.name.optional(), companyFee: money.nullable().optional() })
  .strict()
  .refine((b) => Object.keys(b).length > 0, "Nothing to update");

// `reference` is the merchant's own order id (`barcode` accepted as an alias for older integrations).
// `governorate` / `city` are codes from GET /locations; optional for older integrations, validated when sent.
export const merchantOrderBody = z
  .object({
    fullName: str.name,
    phone: str.phone,
    governorate: governorateCode.optional(),
    city: cityCode.optional(),
    address: str.address,
    cost: money,
    description: str.note.optional(),
    reference: z.string().trim().min(1).max(60).optional(),
    barcode: z.string().trim().min(1).max(60).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.city && !v.governorate) ctx.addIssue({ code: "custom", path: ["governorate"], message: "Required with city" });
    cityInGovernorate(v, ctx);
  });
