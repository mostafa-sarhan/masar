import { Router } from "express";
import { GOVERNORATES } from "@masar/shared";

// Public list of governorate and city codes, for merchant API integrations.
const router = Router();
router.get("/", (_req, res) => {
  res.set("Cache-Control", "public, max-age=86400");
  res.json({ data: GOVERNORATES });
});

export default router;
