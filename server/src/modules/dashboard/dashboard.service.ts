import { Request } from "express";
import { Order } from "../orders/order.model";
import { tenantSettings } from "../tenants/tenants.service";
import { scope } from "../../lib/scope";
import { dayStart, localDay } from "../../lib/time";
import { ORDER_STATUSES } from "../orders/order-status";

const DAY_MS = 24 * 60 * 60 * 1000;
// An order still with a courier after this long is flagged as late.
const LATE_AFTER_DAYS = 3;

// Everything the staff dashboard shows, in one request. "Today" is the tenant's local day.
export async function overview(req: Request, now = new Date()) {
  const tz = tenantSettings(req.tenant!).timezone;
  const base = scope(req);
  const todayStart = dayStart(localDay(now, tz), tz);
  const weekStart = dayStart(localDay(new Date(now.getTime() - 6 * DAY_MS), tz), tz);
  const isToday = { $gte: ["$deliveredAt", todayStart] };

  const [counts, closedToday, couriers, attention, week] = await Promise.all([
    // Open work by status (archived orders excluded).
    Order.aggregate([{ $match: { ...base, isArchived: false } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    // Closed today, with the cash collected on delivered orders.
    Order.aggregate([
      { $match: { ...base, deliveredAt: { $gte: todayStart } } },
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$cost" } } },
    ]),
    // Each courier with open orders or results today.
    Order.aggregate([
      { $match: { ...base, courier: { $ne: null }, $or: [{ status: "with_courier" }, { deliveredAt: { $gte: todayStart } }] } },
      {
        $group: {
          _id: "$courier",
          open: { $sum: { $cond: [{ $eq: ["$status", "with_courier"] }, 1, 0] } },
          closedToday: { $sum: { $cond: [{ $and: [{ $ne: ["$deliveredAt", null] }, isToday] }, 1, 0] } },
          deliveredToday: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "delivered"] }, isToday] }, 1, 0] } },
          cashToday: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "delivered"] }, isToday] }, "$cost", 0] } },
        },
      },
      { $lookup: { from: "deliveries", localField: "_id", foreignField: "_id", as: "ref" } },
      { $project: { _id: 1, open: 1, closedToday: 1, deliveredToday: 1, cashToday: 1, name: { $ifNull: [{ $first: "$ref.name" }, null] } } },
      { $sort: { open: -1, name: 1 } },
      { $limit: 12 },
    ]),
    // Returned/refused since yesterday, and orders stuck with a courier.
    Order.find({
      ...base,
      isArchived: false,
      $or: [
        { status: { $in: ["returned", "refused"] }, deliveredAt: { $gte: new Date(todayStart.getTime() - DAY_MS) } },
        { status: "with_courier", updatedAt: { $lte: new Date(now.getTime() - LATE_AFTER_DAYS * DAY_MS) } },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(6)
      .select("barcode fullName address status reason updatedAt courier")
      .populate({ path: "courier", select: "name", match: base })
      .lean(),
    // Deliveries per local day for the last 7 days.
    Order.aggregate([
      { $match: { ...base, status: "delivered", deliveredAt: { $gte: weekStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt", timezone: tz } }, delivered: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(counts.map((r) => [r._id, r.count]));
  const closed = Object.fromEntries(closedToday.map((r) => [r._id, r]));
  const perDay = new Map(week.map((r) => [r._id as string, r.delivered as number]));

  return {
    counts: Object.fromEntries(ORDER_STATUSES.map((s) => [s, byStatus[s] ?? 0])),
    today: {
      delivered: closed.delivered?.count ?? 0,
      returned: closed.returned?.count ?? 0,
      refused: closed.refused?.count ?? 0,
      cash: closed.delivered?.amount ?? 0,
    },
    couriers,
    attention: attention.map((o) => ({
      _id: o._id,
      barcode: o.barcode,
      fullName: o.fullName,
      address: o.address,
      status: o.status,
      reason: o.reason ?? null,
      courier: o.courier ?? null,
      updatedAt: o.updatedAt,
      late: o.status === "with_courier",
    })),
    week: Array.from({ length: 7 }, (_, i) => {
      const day = localDay(new Date(now.getTime() - (6 - i) * DAY_MS), tz);
      return { day, delivered: perDay.get(day) ?? 0 };
    }),
  };
}
