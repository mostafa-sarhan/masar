import { Router } from "express";
import { requireAuthAllowingPasswordChange } from "./auth.middleware";
import * as c from "./auth.controller";
import { limits } from "../../lib/rate-limit";
import { blockInDemo } from "../../lib/demo";

const router = Router();

router.post("/login", limits.login, c.login);
router.post("/refresh", limits.refresh, c.refresh);
router.post("/logout", c.logout);
router.get("/me", requireAuthAllowingPasswordChange, c.me);
// Demo accounts are shared by every visitor: their passwords can't change.
router.post("/change-password", requireAuthAllowingPasswordChange, blockInDemo, limits.passwordChange, c.changePassword);

export default router;
