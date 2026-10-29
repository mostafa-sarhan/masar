// Escapes text before inserting it into HTML written with document.write.
const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);
