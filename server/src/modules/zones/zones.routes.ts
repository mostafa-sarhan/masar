import { Router } from "express";
import { requireAuth, adminOnly, staffOnly } from "../auth/auth.middleware";
import * as c from "./zones.controller";

const router = Router();
router.use(requireAuth, staffOnly);

router.get("/", c.list);
router.get("/quote", c.quote);
router.post("/", adminOnly, c.create);
router.put("/:id", adminOnly, c.update);
router.delete("/:id", adminOnly, c.remove);

export default router;
