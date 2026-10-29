import { ORDER_STATUSES, FINAL_STATUSES, allowedTransitions, type OrderStatus, type Role } from "@masar/shared";

export { ORDER_STATUSES, FINAL_STATUSES };

// Status codes come from the API; labels are UI only.
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد التنفيذ",
  with_courier: "مع المندوب",
  delivered: "تم التسليم",
  returned: "مرتجع",
  exchanged: "استبدال",
  refused: "مرفوض",
};
export const statusLabel = (code: string) => STATUS_LABELS[code as OrderStatus] ?? code;

// The server enforces the state machine; the UI only offers valid options.
export const nextStatuses = (from: OrderStatus, role: Role | undefined) => (role ? allowedTransitions(from, role) : []);
