import { useEffect, useState } from "react";
import { getOrder, getOrderHistory, trackingUrl } from "./services/ordersApi";
import { errorMessage } from "./services/errors";
import StatusTimeline from "./StatusTimeline";
import Money from "./Money";
import { formatDate } from "./utils/dataUtils";
import { statusLabel } from "./utils/orderStatus";

const ACTION_LABELS = { CREATE: "إنشاء", UPDATE: "تعديل", STATUS_CHANGE: "تغيير الحالة", DELETE: "حذف" };

// Side panel: order data, status timeline, change history and the public tracking link.
export default function OrderDetails({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    Promise.all([getOrder(orderId), getOrderHistory(orderId)])
      .then(([o, h]) => {
        setOrder(o);
        setHistory(h);
      })
      .catch((err) => alert(errorMessage(err)));
  }, [orderId]);

  const link = order && trackingUrl(order.trackingId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={onClose}>
      <aside className="bg-edit w-full md:w-[480px] h-full overflow-y-auto p-6 space-y-6 text-start" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">تفاصيل الشحنة</h2>
          <button onClick={onClose} className="text-2xl">✕</button>
        </div>

        {!order ? (
          <p>جاري التحميل...</p>
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              {[
                ["الباركود", <span dir="ltr">{order.barcode}</span>],
                ["الحالة", statusLabel(order.status)],
                ["العميل", order.fullName],
                ["الهاتف", <span dir="ltr">{order.phone}</span>],
                ["العنوان", order.address],
                ["المبلغ", <Money value={order.cost} />],
                ["الشركة", order.merchant?.name || "-"],
                ["المندوب", order.courier?.name || "-"],
                ["ملاحظات", order.description || "-"],
                ["التاريخ", formatDate(order.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="opacity-70">{k}</dt>
                  <dd className="col-span-2">{v}</dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="font-bold mb-1">رابط التتبع للعميل</h3>
              <div className="flex gap-2">
                <input readOnly value={link} dir="ltr" className="flex-1 text-black bg-white rounded p-1 text-xs" />
                <button className="bg-blue-600 px-3 rounded" onClick={() => navigator.clipboard?.writeText(link)}>نسخ</button>
              </div>
            </section>

            <section>
              <h3 className="font-bold mb-2">مراحل الشحنة</h3>
              <StatusTimeline events={order.statusHistory} showWho />
            </section>

            <section>
              <h3 className="font-bold mb-2">سجل التعديلات</h3>
              <ul className="text-sm space-y-1">
                {history.map((h) => (
                  <li key={h._id}>
                    {formatDate(h.createdAt)} · {ACTION_LABELS[h.action] || h.action} · {h.actor?.email || "API"}
                    {h.changes && h.action !== "DELETE" && (
                      <span className="opacity-80"> — {Object.entries(h.changes).map(([f, c]) => `${f}: ${c.from ?? "-"} ← ${c.to ?? "-"}`).join("، ")}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}
