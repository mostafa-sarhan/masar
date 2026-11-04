import { z } from "zod";
import { str, money } from "../../lib/validate";

export const importQuery = z.object({ mode: z.enum(["dry-run", "commit"]).default("dry-run") });

// One spreadsheet row after header mapping and normalisation.
export const importRow = z
  .object({
    fullName: str.name,
    phone: str.phone,
    governorate: str.short, // name (Arabic or English) or code, matched to the location list
    city: str.short,
    address: str.address,
    cost: money,
    merchant: str.name, // merchant (company) name, resolved within the tenant
    description: str.note.optional(),
    reference: z.string().trim().min(1).max(60).optional(),
  })
  .strict();
export type ImportRow = z.infer<typeof importRow>;

// Accepted column headers (Arabic or English, case-insensitive).
export const HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  fullName: ["اسم العميل", "الاسم", "العميل", "name", "full name", "fullname", "customer"],
  phone: ["رقم الهاتف", "الهاتف", "الموبايل", "phone", "mobile"],
  governorate: ["المحافظة", "محافظة", "governorate", "state", "province"],
  city: ["المدينة", "المنطقة", "الحي", "المركز", "city", "area", "district"],
  address: ["العنوان", "العنوان بالتفصيل", "address"],
  cost: ["المبلغ", "القيمة", "cost", "amount", "price"],
  merchant: ["الشركة", "التاجر", "merchant", "company"],
  description: ["ملاحظات", "notes", "description"],
  reference: ["المرجع", "رقم الطلب", "reference", "ref", "order id"],
};

export const TEMPLATE_HEADERS = ["اسم العميل", "رقم الهاتف", "المحافظة", "المدينة", "العنوان", "المبلغ", "الشركة", "ملاحظات", "المرجع"];
