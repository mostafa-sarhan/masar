export const ROLES = ["owner", "admin", "employee", "courier", "merchant"] as const;
export type Role = (typeof ROLES)[number];

// Owners have every admin right. Staff = the company's own team (not couriers or merchants).
export const ADMIN_ROLES: Role[] = ["owner", "admin"];
export const STAFF_ROLES: Role[] = ["owner", "admin", "employee"];
export const isAdminRole = (role: string | undefined) => ADMIN_ROLES.includes(role as Role);
export const isStaffRole = (role: string | undefined) => STAFF_ROLES.includes(role as Role);
