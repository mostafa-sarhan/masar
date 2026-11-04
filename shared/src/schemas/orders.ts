import { z } from "zod";
import { ORDER_STATUSES } from "../order-status";
import { objectId, str, money, day, pagination } from "../validators";
import { GOVERNORATE_CODES, isCityOf } from "../geo/egypt";

export const governorateCode = z.enum(GOVERNORATE_CODES, { message: "Unknown governorate" });
export const cityCode = z.string().trim().regex(/^[A-Z]{1,3}-[A-Z0-9-]{1,60}$/, "Unknown city");

// The city must be one of the governorate's (checked when both are present).
export const cityInGovernorate = (v: { governorate?: string | null; city?: string | null }, ctx: z.RefinementCtx) => {
  if (v.governorate && v.city && !isCityOf(v.city, v.governorate)) {
    ctx.addIssue({ code: "custom", path: ["city"], message: "City is not in this governorate" });
  }
};

// Strict schemas: unknown fields are rejected, so server-controlled fields can never be sent.
const orderFields = {
  fullName: str.name,
  phone: str.phone,
  address: str.address,
  cost: money,
  description: str.note,
  merchant: objectId,
  courier: objectId.nullable(),
  status: z.enum(ORDER_STATUSES),
  reason: z.string().trim().max(300).nullable(),
  governorate: governorateCode,
  city: cityCode,
  // Shipping price for this order; quoted from the tenant's zones, admins may override it.
  shippingFee: money,
};

// Without the city check, so other schemas can pick / omit fields (refined objects can't be).
export const createOrderObject = z
  .object({
    fullName: orderFields.fullName,
    phone: orderFields.phone,
    address: orderFields.address,
    cost: orderFields.cost,
    description: orderFields.description.optional(),
    merchant: orderFields.merchant,
    courier: objectId.optional(),
    governorate: orderFields.governorate,
    city: orderFields.city,
    shippingFee: orderFields.shippingFee.optional(),
  })
  .strict();
export const createOrderSchema = createOrderObject.superRefine(cityInGovernorate);
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object(orderFields).partial().strict().superRefine(cityInGovernorate);
export type OrderUpdate = z.infer<typeof updateOrderSchema>;

export const listQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9+-]*$/, "Digits or barcode characters only")
    .optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  merchant: objectId.optional(),
  courier: objectId.optional(),
  governorate: governorateCode.optional(),
  zone: objectId.optional(),
  date: day.optional(),
  from: day.optional(),
  to: day.optional(),
  archived: z.enum(["true", "false", "all"]).default("false"),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const pagedListQuery = listQuerySchema.extend(pagination.shape);

export const barcodeParams = z.object({ barcode: str.barcode });

export const bulkAssignSchema = z.object({ orderIds: z.array(objectId).min(1).max(500), courier: objectId }).strict();

export const bulkStatusSchema = z
  .object({
    updates: z
      .array(z.object({ id: objectId, status: z.enum(ORDER_STATUSES) }).strict())
      .min(1)
      .max(500),
  })
  .strict();

// Courier app: outcome of a delivery.
export const courierOutcomeSchema = z
  .object({
    status: z.enum(["delivered", "returned", "refused", "exchanged"]),
    reason: z.string().trim().max(300).optional(),
  })
  .strict()
  .refine((b) => !["returned", "refused"].includes(b.status) || !!b.reason, { message: "A reason is required", path: ["reason"] });
