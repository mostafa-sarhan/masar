import { Request } from "express";
import mongoose from "mongoose";
import { Order, OrderDoc, createWithUniqueBarcode } from "./order.model";
import { Courier } from "../couriers/courier.model";
import { Merchant } from "../merchants/merchant.model";
import { AuditEvent } from "../audit/audit-event.model";
import { OrderStatus, canTransition, isFinal, allowedTransitions } from "./order-status";
import { forbiddenFields, canSetShippingFee } from "./permissions";
import { quoteShipping } from "../zones/zones.service";
import { isCityOf } from "@masar/shared";
import { CreateOrderInput, OrderUpdate, ListQuery } from "./orders.schema";
import { auditEvent, diff, recordAudit } from "../audit/audit.service";
import { assertOrderQuota } from "../tenants/tenants.service";
import { AppError, forbidden, notFound } from "../../lib/errors";
import { scope } from "../../lib/scope";
import { withTransaction } from "../../lib/transaction";
import { config } from "../../config";
import { tenantSettings } from "../tenants/tenants.service";
import { dayStart, dayEnd } from "../../lib/time";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Mongo filter for list/export/report queries. Days are in the tenant's timezone.
export function buildOrderFilter(req: Request, q: ListQuery) {
  const filter: Record<string, unknown> = { ...scope(req) };
  if (q.archived !== "all") filter.isArchived = q.archived === "true";
  if (q.status) filter.status = q.status;
  if (q.merchant) filter.merchant = new mongoose.Types.ObjectId(q.merchant);
  if (q.courier) filter.courier = new mongoose.Types.ObjectId(q.courier);
  if (q.governorate) filter.governorate = q.governorate;
  if (q.zone) filter.zone = new mongoose.Types.ObjectId(q.zone);
  if (q.search) {
    // Prefix match so the phone / barcode indexes are used.
    const rx = new RegExp(`^${escapeRegex(q.search)}`);
    filter.$or = [{ phone: rx }, { barcode: rx }];
  }
  const from = q.from ?? q.date;
  const to = q.to ?? q.date;
  if (from || to) {
    const tz = tenantSettings(req.tenant!).timezone;
    filter.createdAt = {
      ...(from && { $gte: dayStart(from, tz) }),
      ...(to && { $lte: dayEnd(to, tz) }),
    };
  }
  return filter;
}

// Populated refs are filtered by tenant too (the plugin rejects unscoped populate queries).
export const populateRefs = <T>(req: Request, query: mongoose.Query<T, unknown>) =>
  query
    .populate({ path: "courier", select: "name", match: scope(req) })
    .populate({ path: "merchant", select: "name", match: scope(req) })
    .populate({ path: "zone", select: "name", match: scope(req) });

async function assertExists(req: Request, model: typeof Courier | typeof Merchant, id: string | null | undefined, what: string) {
  if (id && !(await model.exists({ _id: id, ...scope(req) }))) {
    throw new AppError(400, "VALIDATION_ERROR", `${what} does not exist`, [{ path: what.toLowerCase(), message: "Not found" }]);
  }
}

// ---------- Reads ----------
// `constraint` narrows the query further (e.g. a merchant's or courier's own orders).
export async function listOrders(req: Request, q: ListQuery, page: number, limit: number, constraint: Record<string, unknown> = {}) {
  const filter = { ...buildOrderFilter(req, q), ...constraint };
  const [items, stats] = await Promise.all([
    populateRefs(req, Order.find(filter).select("-statusHistory").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)).lean(),
    Order.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: 1 }, totalCost: { $sum: "$cost" } } }]),
  ]);
  const total = stats[0]?.total ?? 0;
  return { items, meta: { total, page, pages: Math.ceil(total / limit), totalCost: stats[0]?.totalCost ?? 0 } };
}

export async function exportOrders(req: Request, q: ListQuery) {
  const filter = buildOrderFilter(req, q);
  const [items, total] = await Promise.all([
    populateRefs(req, Order.find(filter).select("-statusHistory").sort({ createdAt: -1 }).limit(config.exportMaxRows)).lean(),
    Order.countDocuments(filter),
  ]);
  return { items, meta: { total, truncated: total > items.length } };
}

export async function statusCounts(req: Request) {
  const rows = await Order.aggregate([{ $match: scope(req) }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

export async function getOrder(req: Request, filter: Record<string, unknown>) {
  const order = await populateRefs(req, Order.findOne({ ...filter, ...scope(req) })).lean();
  if (!order) throw notFound("Order");
  return order;
}

export async function orderHistory(req: Request, id: string) {
  if (!(await Order.exists({ _id: id, ...scope(req) }))) throw notFound("Order");
  return AuditEvent.find({ ...scope(req), entity: "order", entityId: id }).sort({ createdAt: 1 }).limit(200).lean();
}

// ---------- Create ----------
export async function createOrder(req: Request, input: CreateOrderInput) {
  // Reached by staff and by the merchant portal (which fixes `merchant` to the merchant's own id).
  await Promise.all([assertExists(req, Merchant, input.merchant, "Merchant"), assertExists(req, Courier, input.courier, "Courier")]);
  await assertOrderQuota(req.tenant!);
  if (input.shippingFee !== undefined && !canSetShippingFee(req.user!.role)) {
    throw new AppError(403, "FORBIDDEN_FIELDS", "You can't change these fields", ["shippingFee"]);
  }
  const quote = await quoteShipping(req.tenant!._id, input.merchant, input.governorate, input.city);
  const shippingFee = input.shippingFee ?? quote.shippingFee;

  return withTransaction(async () => {
    const status = input.courier ? "with_courier" : "pending";
    const order = await createWithUniqueBarcode({ ...input, ...scope(req), zone: quote.zone, shippingFee, status, statusHistory: [statusEvent(req, status)] });
    await recordAudit(req, { entity: "order", entityId: order._id, action: "CREATE", label: order.barcode, changes: { status: { from: null, to: order.status } } });
    return order;
  });
}

// ---------- Update ----------
// Validates the change against role permissions and the status state machine, and returns
// the $set to apply. Throws on any violation. Money and status rules live here only.
export async function planUpdate(req: Request, order: OrderDoc, input: OrderUpdate) {
  const role = req.user!.role;

  const denied = forbiddenFields(role, Object.keys(input));
  if (denied.length) throw new AppError(403, "FORBIDDEN_FIELDS", "You can't change these fields", denied);
  if (order.isArchived && !["owner", "admin"].includes(role)) throw forbidden("Archived orders can only be changed by an admin");

  await Promise.all([assertExists(req, Merchant, input.merchant, "Merchant"), assertExists(req, Courier, input.courier, "Courier")]);

  const set: Record<string, unknown> = { ...input };
  const from = order.status as OrderStatus;
  const to = input.status;

  // The shipping price is locked once the order is delivered (it's in the fee snapshot then).
  if (input.shippingFee !== undefined && from === "delivered" && input.shippingFee !== order.shippingFee) {
    throw new AppError(409, "SHIPPING_FEE_LOCKED", "The shipping price can't change after delivery");
  }
  // A new destination or merchant is re-quoted, unless the admin sets the price in the same change.
  const governorate = input.governorate ?? order.governorate;
  let city = input.city !== undefined ? input.city : order.city;
  // Moving to another governorate without naming a city clears the old one.
  if (input.governorate && input.governorate !== order.governorate && input.city === undefined) city = set.city = null;
  if (city && governorate && !isCityOf(city, governorate)) {
    throw new AppError(400, "VALIDATION_ERROR", "City is not in this governorate", [{ path: "city", message: "City is not in this governorate" }]);
  }
  const placeChanged = (input.governorate !== undefined && input.governorate !== order.governorate) || (input.city !== undefined && input.city !== order.city);
  const merchantChanged = input.merchant !== undefined && input.merchant !== order.merchant?.toString();
  if ((placeChanged || merchantChanged) && from !== "delivered") {
    const quote = await quoteShipping(req.tenant!._id, input.merchant ?? order.merchant, governorate, city);
    set.zone = quote.zone;
    if (input.shippingFee === undefined) set.shippingFee = quote.shippingFee;
  }

  if (to && to !== from) {
    if (!canTransition(from, to, role)) {
      throw new AppError(409, "INVALID_STATUS_TRANSITION", `Can't change status from ${from} to ${to}`, {
        from,
        to,
        allowed: allowedTransitions(from, role),
      });
    }
    const courier = input.courier !== undefined ? input.courier : order.courier;
    if (to === "with_courier" && !courier) {
      throw new AppError(400, "VALIDATION_ERROR", "A courier is required", [{ path: "courier", message: "Required" }]);
    }
    if (to === "pending") set.courier = null; // back to the warehouse, unassigned
    if (isFinal(to)) set.deliveredAt = new Date();
    if (isFinal(from) && !isFinal(to)) {
      set.deliveredAt = null;
      set.isArchived = false;
    }
    // Lock in the fees that apply right now; drop them if a delivery is corrected.
    if (to === "delivered") {
      const fees = await feesFor(req, (input.merchant ?? order.merchant)?.toString());
      const shippingFee = (set.shippingFee !== undefined ? set.shippingFee : order.shippingFee) as number | null;
      set.fees = { ...fees, company: shippingFee ?? fees.company };
    }
    if (from === "delivered") set.fees = null;
  } else {
    delete set.status;
  }
  return set;
}

// Courier fee from the tenant; company fee from the merchant's override, else the tenant.
// Cached per request: a bulk action looks each merchant up once.
const merchantFeeCache = new WeakMap<Request, Map<string, number | null>>();
export async function feesFor(req: Request, merchantId: string | undefined) {
  const { fees } = tenantSettings(req.tenant!);
  if (!merchantId) return { ...fees };
  const cache = merchantFeeCache.get(req) ?? merchantFeeCache.set(req, new Map()).get(req)!;
  if (!cache.has(merchantId)) {
    const m = await Merchant.findOne({ _id: merchantId, ...scope(req) }).select("companyFee").lean();
    cache.set(merchantId, m?.companyFee ?? null);
  }
  return { courier: fees.courier, company: cache.get(merchantId) ?? fees.company };
}

// Timeline entry for a status change made in this request.
export const statusEvent = (req: Request, status: string, reason?: string | null) => ({
  status,
  at: new Date(),
  by: req.user ? { id: new mongoose.Types.ObjectId(req.user.id), email: req.user.email, role: req.user.role } : { role: "merchant_api" },
  ...(reason && { reason }),
});

// $set plus a timeline $push when the status changes.
const toUpdate = (req: Request, set: Record<string, unknown>) => ({
  $set: set,
  ...(typeof set.status === "string" && { $push: { statusHistory: statusEvent(req, set.status, set.reason as string | undefined) } }),
});

const conflict = () => new AppError(409, "CONFLICT", "The order was changed by someone else, reload and try again");

export async function updateOrder(req: Request, id: string, input: OrderUpdate, constraint: Record<string, unknown> = {}) {
  const order = await Order.findOne({ _id: id, ...scope(req), ...constraint });
  if (!order) throw notFound("Order");

  const set = await planUpdate(req, order, input);
  if (!Object.keys(set).length) return order;

  return withTransaction(async () => {
    // Optimistic concurrency: only apply if nobody changed the order since we read it.
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, ...scope(req), updatedAt: order.updatedAt },
      toUpdate(req, set),
      { returnDocument: "after", runValidators: true }
    );
    if (!updated) throw conflict();

    const changes = diff(order.toObject(), set);
    await recordAudit(req, { entity: "order", entityId: order._id, action: changes.status ? "STATUS_CHANGE" : "UPDATE", label: order.barcode, changes });
    return updated;
  });
}

// ---------- Bulk ----------
// All-or-nothing: validate every order first, then one bulkWrite + audit insert in a transaction.
// Each write is guarded by updatedAt; a concurrent edit aborts the whole batch with 409.
async function applyBulk(req: Request, orders: OrderDoc[], plans: Record<string, unknown>[]) {
  return withTransaction(async () => {
    const result = await Order.bulkWrite(
      orders.map((order, i) => ({
        updateOne: { filter: { _id: order._id, ...scope(req), updatedAt: order.updatedAt }, update: toUpdate(req, plans[i]) },
      }))
    );
    if (result.matchedCount !== orders.length) throw conflict();
    await AuditEvent.insertMany(
      orders.map((order, i) => {
        const changes = diff(order.toObject(), plans[i]);
        return auditEvent(req, { entity: "order", entityId: order._id, action: changes.status ? "STATUS_CHANGE" : "UPDATE", label: order.barcode, changes });
      })
    );
    return { requested: orders.length, updated: result.modifiedCount };
  });
}

async function loadAll(req: Request, ids: string[]) {
  const orders = await Order.find({ _id: { $in: ids }, ...scope(req) });
  const byId = new Map(orders.map((o) => [o._id.toString(), o]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) throw new AppError(404, "NOT_FOUND", "Some orders were not found", { missing });
  return ids.map((id) => byId.get(id)!);
}

async function planAll(req: Request, orders: OrderDoc[], inputs: OrderUpdate[]) {
  const plans: Record<string, unknown>[] = [];
  const problems: { id: string; barcode: string; code: string; message: string }[] = [];
  for (const [i, order] of orders.entries()) {
    try {
      plans.push(await planUpdate(req, order, inputs[i]));
    } catch (err) {
      const e = err as AppError;
      problems.push({ id: order._id.toString(), barcode: order.barcode, code: e.code ?? "INTERNAL_ERROR", message: e.message });
    }
  }
  if (problems.length) throw new AppError(409, "INVALID_STATUS_TRANSITION", "Some orders can't be changed; nothing was saved", problems);
  return plans;
}

// Hand pending orders to a courier.
export async function bulkAssign(req: Request, orderIds: string[], courier: string) {
  const orders = await loadAll(req, [...new Set(orderIds)]);
  const plans = await planAll(req, orders, orders.map(() => ({ courier, status: "with_courier" as const })));
  return applyBulk(req, orders, plans);
}

export async function bulkStatus(req: Request, updates: { id: string; status: OrderStatus }[]) {
  const unique = [...new Map(updates.map((u) => [u.id, u])).values()];
  const orders = await loadAll(req, unique.map((u) => u.id));
  const plans = await planAll(req, orders, unique.map((u) => ({ status: u.status })));
  return applyBulk(req, orders, plans);
}

// ---------- Delete ----------
export async function deleteOrder(req: Request, id: string) {
  await withTransaction(async () => {
    const order = await Order.findOneAndDelete({ _id: id, ...scope(req) });
    if (!order) throw notFound("Order");
    await recordAudit(req, { entity: "order", entityId: order._id, action: "DELETE", label: order.barcode, changes: { order: { from: order.toObject(), to: null } } });
  });
}
