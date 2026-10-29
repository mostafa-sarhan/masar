// Owners have every admin right.
export const ADMIN_ROLES = ["owner", "admin"];
export const isAdmin = (role) => ADMIN_ROLES.includes(role);
export const ROLE_LABELS = { owner: "مالك", admin: "أدمين", employee: "موظف" };
