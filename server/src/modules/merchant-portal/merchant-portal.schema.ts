import { z } from "zod";
import { createOrderObject, cityInGovernorate, listQuerySchema } from "../orders/orders.schema";
import { pagination, day } from "../../lib/validate";

// A merchant can't choose the merchant, the courier or the shipping price.
export const portalOrderBody = createOrderObject.omit({ merchant: true, courier: true, shippingFee: true }).strict().superRefine(cityInGovernorate);
export const portalListQuery = listQuerySchema.pick({ search: true, status: true, governorate: true, date: true, from: true, to: true }).extend(pagination.shape);
export const statementQuery = z.object({ from: day.optional(), to: day.optional() });
