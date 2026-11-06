import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import * as c from "./merchant-portal.controller";
import { blockInDemo } from "../../lib/demo";

// Merchant portal API (role merchant only; every query is limited to the merchant's own data).
const router = Router();
router.use(requireAuth, requireRole("merchant"));

router.get("/orders", c.list);
router.post("/orders", c.create);
router.get("/orders/:id", c.get);
router.get("/quote", c.quote);
router.get("/statement", c.statement);
router.get("/api-key", c.apiKey);
router.post("/api-key", blockInDemo, c.rotateApiKey);

export default router;
