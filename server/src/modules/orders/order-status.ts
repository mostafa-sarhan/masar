import type { OrderStatus } from "@masar/shared";

// Status codes and the state machine live in @masar/shared (used by the client too).
export { ORDER_STATUSES, FINAL_STATUSES, isFinal, allowedTransitions, canTransition, COURIER_OUTCOMES } from "@masar/shared";
export type { OrderStatus } from "@masar/shared";

// Old Arabic values -> codes (used by the migration).
export const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  "قيد التنفيذ": "pending",
  "مع المندوب": "with_courier",
  "تم التسليم": "delivered",
  "مرتجع": "returned",
  "استبدال": "exchanged",
  "مرفوض": "refused",
};
