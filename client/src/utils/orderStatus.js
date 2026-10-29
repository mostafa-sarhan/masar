// Status codes come from the API; labels are UI only.
export const STATUS_LABELS = {
  pending: "قيد التنفيذ",
  with_courier: "مع المندوب",
  delivered: "تم التسليم",
  returned: "مرتجع",
  exchanged: "استبدال",
  refused: "مرفوض",
};
export const ORDER_STATUSES = Object.keys(STATUS_LABELS);
export const FINAL_STATUSES = ["delivered", "returned", "refused"];
export const statusLabel = (code) => STATUS_LABELS[code] || code;

// Mirror of the server's state machine, only to offer valid options (the server enforces it).
const TRANSITIONS = {
  pending: ["with_courier"],
  with_courier: ["delivered", "returned", "refused", "exchanged", "pending"],
  exchanged: ["with_courier", "returned"],
  delivered: [],
  returned: [],
  refused: [],
};
const ADMIN_CORRECTIONS = {
  delivered: ["with_courier"],
  returned: ["with_courier", "pending"],
  refused: ["with_courier", "pending"],
};
export const nextStatuses = (from, role) => [
  ...(TRANSITIONS[from] || []),
  ...(role === "admin" || role === "owner" ? ADMIN_CORRECTIONS[from] || [] : []),
];
