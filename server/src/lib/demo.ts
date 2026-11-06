import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { AppError } from "./errors";

// The demo company (only when DEMO_MODE=true). Everything else is a real company.
export const isDemoTenant = (tenant: { slug?: string } | null | undefined) => config.demo.enabled && tenant?.slug === config.demo.slug;

// Actions the demo company can't take: new logins (emails), password and role changes, API keys.
// Mount after requireAuth (it needs req.tenant).
export function blockInDemo(req: Request, _res: Response, next: NextFunction) {
  if (isDemoTenant(req.tenant)) return next(new AppError(403, "DEMO_DISABLED", "Not available in the demo"));
  next();
}
