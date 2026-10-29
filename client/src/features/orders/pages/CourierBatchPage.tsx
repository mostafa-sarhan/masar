import type { OrderStatus } from "@masar/shared";
import type { Order, Courier, Summary, ReportMeta } from "@/lib/types";

// An open order plus the outcome chosen on this page (saved together).
type BatchOrder = Order & { nextStatus?: OrderStatus };
import Money from "@/components/ui/Money";
import { useState } from "react";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import { OrdersHeader, OrderRow } from "@/features/orders/components/OrderRow";
import { getOrders, bulkStatus } from "@/features/orders/api/orders-api";
import { getSettlement } from "@/lib/resources-api";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "@/app/auth-context";
import { isAdmin as isAdminRole } from "@/lib/roles";
import { nextStatuses, statusLabel } from "@/lib/order-status";

const MAX_ORDERS = 100;

// A courier's open orders: set each result, save the batch, see the settlement (calculated on the server).
export default function Alldelivery() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const [courier, setCourier] = useState("");
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [orders, setOrders] = useState<BatchOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [courierFee, setCourierFee] = useState("");
  const [settlement, setSettlement] = useState<(Summary & { fees: ReportMeta["fees"] }) | null>(null);

  const courierName = couriers.find((c) => c._id === courier)?.name;

  const loadSettlement = async (list: BatchOrder[], fee = courierFee) => {
    if (!list.length) return setSettlement(null);
    const { data, meta } = await getSettlement(list.map((o) => o._id), isAdmin && fee !== "" ? { courierFee: Number(fee) } : {});
    setSettlement({ ...data, fees: meta.fees });
  };

  const loadOrders = async (courierId: string) => {
    setOrders([]);
    setSettlement(null);
    if (!courierId) return;
    try {
      setLoading(true);
      const { data, meta } = await getOrders({ courier: courierId, status: "with_courier", limit: MAX_ORDERS });
      setOrders(data);
      setTotal(meta.total);
      await loadSettlement(data);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourier = (courierId: string) => {
    setCourier(courierId);
    loadOrders(courierId);
  };

  const handleStatusChange = (orderId: string, status: OrderStatus) =>
    setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, nextStatus: status } : o)));

  // Rows the user didn't touch count as delivered (the courier's default outcome).
  const handleSaveAll = async () => {
    const updates = orders
      .filter((o) => o.status === "with_courier")
      .map((o) => ({ id: o._id, status: o.nextStatus || "delivered" }))
      .filter((u) => u.status !== "with_courier");
    if (!updates.length) return;

    try {
      setLoading(true);
      await bulkStatus(updates);
      const byId = new Map(updates.map((u) => [u.id, u.status]));
      const saved: BatchOrder[] = orders.map((o) => (byId.has(o._id) ? { ...o, status: byId.get(o._id)!, nextStatus: undefined } : o));
      setOrders(saved);
      await loadSettlement(saved);
      alert("تم حفظ التعديلات بنجاح ✅");
    } catch (err) {
      alert(errorMessage(err)); // validation failed: nothing was saved
    } finally {
      setLoading(false);
    }
  };

  const notDelivered = settlement ? settlement.total.amount - settlement.money.deliveredTotal : 0;

  return (
    <div className="w-[98%] m-auto mt-4">
      <div className="flex gap-4 items-center mb-4">
        <CourierSelect value={courier} onChange={handleSelectCourier} onLoaded={setCouriers} />
        {isAdmin && (
          <>
            <span>عمولة المندوب:</span>
            <input
              type="number"
              min="0"
              placeholder={String(settlement?.fees.courier ?? "")}
              value={courierFee}
              onChange={(e) => setCourierFee(e.target.value)}
              onBlur={() => loadSettlement(orders).catch((err) => alert(errorMessage(err)))}
              className="border rounded px-2 py-1 w-24"
            />
          </>
        )}
      </div>

      {loading && <p className="text-center my-4 text-xl">جاري تحميل الأوردرات...</p>}
      {total > MAX_ORDERS && <p className="text-center text-yellow-400">يتم عرض أول {MAX_ORDERS} من {total} أوردر</p>}

      {courier && settlement && (
        <div className="rounded-lg p-4 mb-4 flex gap-8 justify-between items-center">
          <div className="text-xl w-[50%] flex justify-around items-center">
            <div>المندوب: <span className="font-bold mr-2">{courierName}</span></div>
            <div>عدد الأوردرات: <span className="font-bold mr-2">{settlement.total.count}</span></div>
          </div>
          <div className="text-sm w-[50%]">
            <div>إجمالي المبلغ: <span className="font-bold mr-2"><Money value={settlement.total.amount} /></span></div>
            <div>المبلغ المستحق للمندوب: <span className="font-bold mr-2"><Money value={settlement.money.courierCommission} /></span></div>
            <div>اجمالى المبلغ غير المسلّم: <span className="font-bold mr-2"><Money value={notDelivered} /></span></div>
            <div>الباقي بعد خصم المستحق: <span className="font-bold mr-2"><Money value={settlement.money.afterCourier} /></span></div>
          </div>
        </div>
      )}

      <OrdersHeader />
      <div className="my-2">
        {orders.length > 0
          ? orders.map((order, index) => (
              <OrderRow
                key={order._id}
                order={order}
                index={index + 1}
                status={
                  order.status === "with_courier" ? (
                    <select value={order.nextStatus || "with_courier"} onChange={(e) => handleStatusChange(order._id, e.target.value as OrderStatus)} className="border px-2 py-1 rounded">
                      {["with_courier", ...nextStatuses("with_courier", user?.role)].map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  ) : (
                    statusLabel(order.status)
                  )
                }
              />
            ))
          : !loading && <p className="text-center my-4">لا توجد أوردرات مع المندوب</p>}
      </div>

      {orders.some((o) => o.status === "with_courier") && (
        <div className="my-4 flex justify-end">
          <button onClick={handleSaveAll} className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer">
            حفظ الجميع
          </button>
        </div>
      )}
    </div>
  );
}
