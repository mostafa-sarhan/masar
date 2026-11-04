import type { Role } from "../users/user.model";

// Order fields each role may send. Anything else (barcode, isArchived, deliveredAt, ...) is never client-writable.
export const ORDER_CREATE_FIELDS = ["fullName", "phone", "address", "governorate", "city", "cost", "description", "merchant", "courier"] as const;

export const ORDER_UPDATE_FIELDS: Record<Role, readonly string[]> = {
  // Operational changes only: assign a courier, move the status, add a note.
  employee: ["status", "courier", "description", "reason"],
  // Admins can also correct customer, address and financial data, including the shipping price.
  admin: ["status", "courier", "description", "reason", "fullName", "phone", "address", "governorate", "city", "cost", "merchant", "shippingFee"],
  owner: ["status", "courier", "description", "reason", "fullName", "phone", "address", "governorate", "city", "cost", "merchant", "shippingFee"],
  // Couriers report the outcome of their own deliveries (courier app); merchants never edit orders.
  courier: ["status", "reason"],
  merchant: [],
};

// Only admins may set the shipping price themselves (everyone else gets the zone's quote).
export const canSetShippingFee = (role: Role) => role === "owner" || role === "admin";

export const forbiddenFields = (role: Role, fields: string[]) =>
  fields.filter((f) => !ORDER_UPDATE_FIELDS[role].includes(f));
