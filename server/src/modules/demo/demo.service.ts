import { Response } from "express";
import type { Role } from "@masar/shared";
import { config } from "../../config";
import { logger } from "../../lib/logger";
import { AppError } from "../../lib/errors";
import { Tenant } from "../tenants/tenant.model";
import { User, publicUser } from "../users/user.model";
import { loadUsableTenant } from "../tenants/tenants.service";
import { publicTenant, startSession } from "../auth/auth.service";
import { seedCompany, seedEmail, SEED_ROLES } from "./seed-company";
import { randomBytes } from "crypto";

let lastReset: Date | null = null;

const nextReset = () => (lastReset ? new Date(lastReset.getTime() + config.demo.resetMinutes * 60 * 1000) : null);

// What the client needs to show the banner and the "Login as" buttons.
export function demoInfo() {
  if (!config.demo.enabled) return { enabled: false as const };
  return {
    enabled: true as const,
    roles: SEED_ROLES,
    whatsapp: config.demo.whatsapp || null,
    resetMinutes: config.demo.resetMinutes,
    nextResetAt: nextReset(),
  };
}

// Wipes the demo company and seeds it again. Visitors stay signed in (stable ids, sessions kept).
export async function resetDemo(now = new Date()) {
  const result = await seedCompany({
    name: config.demo.name,
    slug: config.demo.slug,
    emailDomain: config.demo.emailDomain,
    // Nobody logs in with it: demo logins are one click, and password changes are blocked.
    password: randomBytes(24).toString("base64url"),
    keepSessions: true,
    now,
  });
  lastReset = now;
  logger.info({ orders: result.orders }, "Demo company reset");
  return result;
}

// Seeds the demo company if it doesn't exist yet (first start).
export async function ensureDemo() {
  if (!(await Tenant.exists({ slug: config.demo.slug }))) await resetDemo();
  else lastReset ??= new Date();
}

// One-click login as the demo company's account for this role.
export async function demoLogin(res: Response, role: Role) {
  if (!config.demo.enabled) throw new AppError(404, "NOT_FOUND", "Demo mode is off");
  const tenant = await Tenant.findOne({ slug: config.demo.slug });
  if (!tenant) throw new AppError(503, "INTERNAL_ERROR", "The demo is being prepared, try again in a minute");
  await loadUsableTenant(tenant._id);
  const user = await User.findOne({ tenantId: tenant._id, email: seedEmail(role, config.demo.emailDomain) });
  if (!user) throw new AppError(503, "INTERNAL_ERROR", "The demo is being prepared, try again in a minute");
  await startSession(res, user);
  return { user: publicUser(user), tenant: publicTenant(tenant) };
}
