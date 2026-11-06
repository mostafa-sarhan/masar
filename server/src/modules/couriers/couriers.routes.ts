import { Router } from "express";
import { requireAuth, adminOnly, staffOnly } from "../auth/auth.middleware";
import * as c from "./couriers.controller";
import { blockInDemo } from "../../lib/demo";

const router = Router();
router.use(requireAuth, staffOnly);

router.get("/", c.list);
router.get("/options", c.options);
router.post("/", adminOnly, c.create);
router.patch("/:id", adminOnly, c.rename);
router.post("/:id/account", adminOnly, blockInDemo, c.createAccount);

export default router;
