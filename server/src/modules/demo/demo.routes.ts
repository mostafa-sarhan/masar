import { Router } from "express";
import { z } from "zod";
import { ROLES } from "@masar/shared";
import { ok } from "../../lib/respond";
import { limits } from "../../lib/rate-limit";
import * as demo from "./demo.service";

// Public: GET /demo (is demo mode on?), POST /demo/login { role } (one-click login, demo mode only).
const router = Router();
const loginBody = z.object({ role: z.enum(ROLES) }).strict();

router.get("/", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  ok(res, demo.demoInfo());
});
router.post("/login", limits.login, async (req, res) => {
  ok(res, await demo.demoLogin(res, loginBody.parse(req.body).role));
});

export default router;
