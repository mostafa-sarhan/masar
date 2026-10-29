import { z } from "zod";
import { str } from "../validators";

// Public "Request access" form. `website` is a honeypot: humans never see or fill it.
export const accessRequestBody = z
  .object({
    companyName: z.string().trim().min(2).max(120),
    contactName: str.name,
    phone: str.phone,
    email: str.email,
    message: z.string().trim().max(1000).optional(),
    website: z.string().max(200).optional(),
  })
  .strict();
export type AccessRequestInput = z.infer<typeof accessRequestBody>;
