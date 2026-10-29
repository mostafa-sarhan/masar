import { Router } from "express";
import { limits } from "../../lib/rate-limit";
import * as c from "./tracking.controller";

// Public, no login. Strict per-IP limit against trackingId enumeration.
const router = Router();
router.get("/:trackingId", limits.tracking, c.get);

export default router;
