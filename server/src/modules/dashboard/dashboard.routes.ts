import { Router } from "express";
import { requireAuth, staffOnly } from "../auth/auth.middleware";
import * as c from "./dashboard.controller";

// Staff dashboard (owner, admin, employee).
const router = Router();
router.use(requireAuth, staffOnly);
router.get("/", c.overview);

export default router;
