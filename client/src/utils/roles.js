// Owners have every admin right. Staff = the company's own team.
export const ADMIN_ROLES = ["owner", "admin"];
export const STAFF_ROLES = ["owner", "admin", "employee"];
export const isAdmin = (role) => ADMIN_ROLES.includes(role);
export const ROLE_LABELS = { owner: "مالك", admin: "أدمين", employee: "موظف", courier: "مندوب", merchant: "تاجر" };

// Where each role lands after login.
export const homeFor = (role) => (role === "courier" ? "/courier" : role === "merchant" ? "/portal" : "/");
