import mongoose from "mongoose";
import { createHash } from "crypto";
import { GOVERNORATES, normalizeArabic, type OrderStatus, type Role } from "@masar/shared";
import { Tenant, PLAN_LIMITS } from "../tenants/tenant.model";
import { User } from "../users/user.model";
import { Courier } from "../couriers/courier.model";
import { Merchant } from "../merchants/merchant.model";
import { Zone } from "../zones/zone.model";
import { Order, generateTrackingId } from "../orders/order.model";
import { AuditEvent } from "../audit/audit-event.model";
import { RefreshToken } from "../auth/refresh-token.model";
import { hashPassword } from "../auth/password";
import { pickZone } from "../zones/zones.service";

// A complete, realistic shipping company: one account per role, couriers, merchants, zones and
// three weeks of orders in every status. Used by `npm run seed` and by demo mode's hourly reset.
// Re-running replaces the company with the same slug (and only that company).

export interface SeedOptions {
  name: string;
  slug: string;
  // Accounts are <role>@<emailDomain>.
  emailDomain: string;
  password: string;
  now?: Date;
  orders?: number;
  // Keep refresh tokens (demo resets shouldn't log visitors out; user ids are stable).
  keepSessions?: boolean;
}

export const SEED_ROLES: Role[] = ["owner", "admin", "employee", "courier", "merchant"];
export const seedEmail = (role: Role, domain: string) => `${role}@${domain}`;
// The same id for a role's account on every reseed, so existing sessions stay valid.
export const seedUserId = (slug: string, role: Role) => new mongoose.Types.ObjectId(createHash("sha256").update(`masar-seed:${slug}:${role}`).digest("hex").slice(0, 24));

// Deterministic randomness: the same company every time, only the dates follow "now".
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COURIERS = ["كريم عادل", "مصطفى سعيد", "أحمد جمال", "يوسف رمضان", "محمود فتحي", "إسلام حسن"];
const MERCHANTS = ["متجر ليلى للأزياء", "بيت العطور", "إلكترونيات النور", "مكتبة الشروق", "عالم الأطفال", "ركن الجمال"];
const FIRST = ["هالة", "عمر", "سارة", "محمد", "منى", "خالد", "دينا", "ياسر", "ريم", "حسام", "إيمان", "شريف", "نورا", "طارق", "آية", "مروان", "هبة", "علي", "ندى", "أحمد"];
const LAST = ["سامي", "خالد", "إبراهيم", "عبد الله", "فاروق", "يوسف", "مصطفى", "علي", "أحمد", "الدين", "رجب", "نبيل", "حسن", "فؤاد", "جمال"];
const STREETS = ["شارع التحرير", "شارع الجمهورية", "شارع النصر", "شارع 9", "شارع عباس العقاد", "شارع الهرم", "شارع جامعة الدول", "شارع البحر", "شارع الثورة", "شارع المحطة"];
const NOTES = ["الاتصال قبل الوصول بنصف ساعة", "التسليم بعد الساعة 5 مساءً", "يمكن ترك الشحنة مع البواب", "العميل يفضّل الدفع عند الاستلام كاملًا"];
const REASONS = { returned: ["العميل لا يرد", "العميل طلب التأجيل", "العنوان غير صحيح"], refused: ["العميل رفض الاستلام", "المنتج لا يطابق الطلب"] };

// Where orders go: most to Cairo, Giza and Alexandria, some across the country.
const DESTINATIONS: [string, number][] = [
  ["C", 34],
  ["GZ", 20],
  ["ALX", 12],
  ["KB", 6],
  ["DK", 5],
  ["SHR", 4],
  ["GH", 4],
  ["MNF", 3],
  ["IS", 2],
  ["PTS", 2],
  ["AST", 2],
  ["SHG", 2],
  ["BA", 2],
  ["LX", 1],
  ["MT", 1],
];

const ZONES = [
  { name: "القاهرة الكبرى", price: 50, governorates: ["C", "GZ", "KB"] },
  { name: "وسط القاهرة", price: 40, cities: ["C-NASR-CITY", "C-HELIOPOLIS", "C-DOWNTOWN", "C-ZAMALEK", "C-GARDEN-CITY", "GZ-DOKKI", "GZ-MOHANDESSIN"] },
  { name: "الإسكندرية والدلتا", price: 65, governorates: ["ALX", "BH", "GH", "MNF", "DK", "SHR", "KFS", "DT"] },
  { name: "مدن القناة", price: 70, governorates: ["PTS", "IS", "SUZ"] },
  { name: "الصعيد", price: 85, governorates: ["FYM", "BNS", "MN", "AST", "SHG", "KN", "LX", "ASN"] },
  { name: "المناطق النائية", price: 110, governorates: ["MT", "WAD", "SIN", "JS", "BA"] },
];

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// Every tenant-owned collection, emptied for this tenant before seeding.
const TENANT_MODELS = [Order, AuditEvent, Zone, Courier, Merchant, User, RefreshToken] as const;

export async function wipeTenant(tenantId: mongoose.Types.ObjectId, { keepSessions = false } = {}) {
  for (const model of TENANT_MODELS) {
    if (keepSessions && model === RefreshToken) continue;
    await (model as mongoose.Model<unknown>).deleteMany({ tenantId });
  }
}

export async function seedCompany(opts: SeedOptions) {
  const now = opts.now ?? new Date();
  const random = rng(20261104);
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  const weighted = <T>(list: [T, number][]) => {
    let n = random() * list.reduce((s, [, w]) => s + w, 0);
    for (const [v, w] of list) if ((n -= w) < 0) return v;
    return list[0][0];
  };

  // Replace the company if it exists (same id, so links and bookmarks keep working).
  const existing = await Tenant.findOne({ slug: opts.slug });
  if (existing) await wipeTenant(existing._id, { keepSessions: opts.keepSessions });
  const tenantFields = {
    name: opts.name,
    slug: opts.slug,
    plan: "pro" as const,
    status: "active" as const,
    trialEndsAt: null,
    limits: { ...PLAN_LIMITS.pro },
    settings: { fees: { courier: 20, company: 45 }, merchantDeductions: ["company" as const], archiveAfterDays: 3, timezone: "Africa/Cairo", currency: "EGP", labelName: opts.name },
  };
  const tenant = existing ? await Tenant.findByIdAndUpdate(existing._id, { $set: tenantFields }, { returnDocument: "after" }) : await Tenant.create(tenantFields);
  const tenantId = tenant!._id;

  const couriers = await Courier.insertMany(COURIERS.map((name) => ({ tenantId, name, nameSearch: normalizeArabic(name) })));
  const merchants = await Merchant.insertMany(MERCHANTS.map((name) => ({ tenantId, name, nameSearch: normalizeArabic(name) })));
  const zones = await Zone.insertMany(ZONES.map((z) => ({ tenantId, governorates: [], cities: [], ...z })));
  // A big merchant with its own prices.
  const greaterCairo = zones.find((z) => z.name === "القاهرة الكبرى")!;
  await Merchant.updateOne({ tenantId, _id: merchants[0]._id }, { $set: { zonePrices: [{ zone: greaterCairo._id, price: 40 }], companyFee: 40 } });
  const merchantPrices = new Map([[String(merchants[0]._id), [{ zone: greaterCairo._id, price: 40 }]]]);

  const password = await hashPassword(opts.password);
  const account = (role: Role, extra: Record<string, unknown> = {}) => ({
    _id: seedUserId(opts.slug, role),
    tenantId,
    email: seedEmail(role, opts.emailDomain),
    role,
    password,
    mustChangePassword: false,
    ...extra,
  });
  const users = await User.insertMany([
    account("owner"),
    account("admin"),
    account("employee"),
    account("courier", { courierId: couriers[0]._id }),
    account("merchant", { merchantId: merchants[0]._id }),
  ]);
  const staff = users.filter((u) => ["owner", "admin", "employee"].includes(u.role));
  const by = (u: (typeof users)[number]) => ({ id: u._id, email: u.email, role: u.role });

  // Orders over the last 21 days; recent ones are still open.
  const count = opts.orders ?? 160;
  const orders = [];
  const barcodes = new Set<string>();
  for (let i = 0; i < count; i++) {
    const ageDays = Math.pow(random(), 1.6) * 21;
    const created = new Date(now.getTime() - ageDays * DAY - random() * 3 * HOUR);
    const governorate = weighted(DESTINATIONS);
    const city = pick(GOVERNORATES.find((g) => g.code === governorate)!.cities).code;
    const merchant = merchants[Math.floor(Math.pow(random(), 1.4) * merchants.length)];
    const courier = couriers[i % couriers.length];
    const zone = pickZone(zones, governorate, city);
    const own = merchantPrices.get(String(merchant._id))?.find((p) => zone && p.zone.equals(zone._id));
    const shippingFee = zone ? (own ? own.price : zone.price) : null;

    // Older orders are mostly closed; today's are mostly still out.
    let status: OrderStatus;
    if (ageDays < 0.6) status = weighted<OrderStatus>([["pending", 5], ["with_courier", 6], ["delivered", 2]]);
    else if (ageDays < 2) status = weighted<OrderStatus>([["with_courier", 4], ["delivered", 6], ["returned", 1], ["refused", 1], ["exchanged", 1]]);
    else status = weighted<OrderStatus>([["delivered", 78], ["returned", 10], ["refused", 7], ["exchanged", 3], ["with_courier", 2]]);

    const creator = pick(staff);
    const history: Record<string, unknown>[] = [{ status: "pending", at: created, by: by(creator) }];
    let t = created.getTime();
    const step = (s: OrderStatus, actor = creator, reason?: string) => {
      t += (2 + random() * 20) * HOUR * (ageDays < 1 ? 0.15 : 1);
      t = Math.min(t, now.getTime() - 5 * 60 * 1000);
      history.push({ status: s, at: new Date(t), by: by(actor), ...(reason && { reason }) });
    };
    let reason: string | null = null;
    if (status !== "pending") step("with_courier");
    if (status === "exchanged") step("exchanged", users[3]);
    if (status === "delivered") step("delivered", users[3]);
    if (status === "returned" || status === "refused") {
      reason = pick(REASONS[status]);
      step(status, users[3], reason);
    }
    const final = ["delivered", "returned", "refused"].includes(status);
    const closedAt = final ? new Date(t) : null;

    let barcode: string;
    do barcode = String(10_000_000 + Math.floor(random() * 90_000_000));
    while (barcodes.has(barcode));
    barcodes.add(barcode);

    orders.push({
      tenantId,
      fullName: `${pick(FIRST)} ${pick(LAST)}`,
      phone: `01${pick(["0", "1", "2", "5"])}${String(Math.floor(random() * 1e8)).padStart(8, "0")}`,
      governorate,
      city,
      address: `${pick(STREETS)}، عمارة ${1 + Math.floor(random() * 60)}، الدور ${1 + Math.floor(random() * 9)}`,
      cost: [150, 220, 250, 320, 450, 600, 780, 950, 1250, 1800][Math.floor(random() * 10)],
      description: random() < 0.25 ? pick(NOTES) : undefined,
      merchant: merchant._id,
      courier: status === "pending" ? null : courier._id,
      zone: zone?._id ?? null,
      shippingFee,
      status,
      reason,
      deliveredAt: closedAt,
      // Delivered orders carry the fee snapshot, as the API writes it.
      fees: status === "delivered" ? { courier: 20, company: shippingFee ?? 45 } : null,
      isArchived: !!closedAt && now.getTime() - closedAt.getTime() > 3 * DAY,
      barcode,
      trackingId: generateTrackingId(),
      statusHistory: history,
      createdAt: created,
      updatedAt: new Date(t),
    });
  }
  const inserted = await Order.insertMany(orders, { timestamps: false } as mongoose.InsertManyOptions);

  // A few audit entries so the log isn't empty.
  await AuditEvent.insertMany(
    inserted.slice(-12).map((o, i) => ({
      tenantId,
      entity: "order",
      entityId: o._id,
      action: i % 3 ? "STATUS_CHANGE" : "CREATE",
      label: o.barcode,
      actor: { id: staff[i % staff.length]._id, email: staff[i % staff.length].email },
      changes: { status: { from: i % 3 ? "pending" : null, to: o.status } },
      createdAt: o.updatedAt,
    })),
    { timestamps: false } as mongoose.InsertManyOptions
  );

  return { tenant: tenant!, accounts: SEED_ROLES.map((role) => ({ role, email: seedEmail(role, opts.emailDomain) })), orders: inserted.length };
}
