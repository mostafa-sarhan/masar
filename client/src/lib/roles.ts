import { ADMIN_ROLES, STAFF_ROLES, isAdminRole, type Role } from "@masar/shared";

export { ADMIN_ROLES, STAFF_ROLES };
export const isAdmin = isAdminRole;

export const ROLE_LABELS: Record<Role, string> = { owner: "مالك", admin: "مدير", employee: "موظف", courier: "مندوب", merchant: "تاجر" };

// Where each role lands after login.
export const homeFor = (role: Role) => (role === "courier" ? "/courier" : role === "merchant" ? "/portal" : role === "employee" ? "/orders" : "/");
