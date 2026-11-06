import { Router } from "express";
import { requireAuth, adminOnly } from "../auth/auth.middleware";
import * as c from "./users.controller";
import { blockInDemo } from "../../lib/demo";

const router = Router();
router.use(requireAuth, adminOnly);

router.get("/", c.list);
router.post("/", blockInDemo, c.create);
router.put("/:id/password", blockInDemo, c.setPassword);
router.put("/:id/role", blockInDemo, c.setRole);
router.get("/audit-logs", c.auditLogs);

export default router;
