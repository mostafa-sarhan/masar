import { useCallback, useEffect, useState } from "react";
import PortalLayout from "./PortalLayout";
import Money from "./Money";
import { getCourierOrders, getCourierToday, reportOutcome } from "./services/portalsApi";
import { errorMessage } from "./services/errors";
import { statusLabel } from "./utils/orderStatus";

const OUTCOMES = [
  { status: "delivered", className: "bg-green-600" },
  { status: "returned", className: "bg-yellow-600", needsReason: true },
  { status: "refused", className: "bg-red-600", needsReason: true },
  { status: "exchanged", className: "bg-purple-600" },
];

// Mobile-first: the courier's open orders with call / map buttons and one-tap outcomes.
export default function CourierApp() {
  const [orders, setOrders] = useState(null);
  const [today, setToday] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    Promise.all([getCourierOrders(), getCourierToday()])
      .then(([list, t]) => {
        setOrders(list);
        setToday(t);
      })
      .catch((err) => alert(errorMessage(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (order, outcome) => {
    let reason;
    if (outcome.needsReason) {
      reason = window.prompt("السبب");
      if (!reason) return;
    } else if (!window.confirm(`${statusLabel(outcome.status)}: ${order.fullName}؟`)) return;
    try {
      setBusy(order._id);
      await reportOutcome(order._id, outcome.status, reason);
      load();
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <PortalLayout title="مهامي اليوم">
      {today && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-center">
          <div className="bg-edit rounded p-3"><p className="text-sm">مفتوح</p><p className="text-2xl font-bold">{today.open}</p></div>
          <div className="bg-edit rounded p-3"><p className="text-sm">تم التسليم اليوم</p><p className="text-2xl font-bold">{today.delivered}</p></div>
          <div className="bg-edit rounded p-3"><p className="text-sm">مرتجع / مرفوض</p><p className="text-2xl font-bold">{today.returned} / {today.refused}</p></div>
          <div className="bg-edit rounded p-3"><p className="text-sm">نقدية للتسليم</p><p className="text-xl font-bold"><Money value={today.cashToHandOver} /></p></div>
        </div>
      )}

      {!orders ? (
        <p>جاري التحميل...</p>
      ) : orders.length === 0 ? (
        <p className="text-center opacity-80">لا توجد أوردرات مفتوحة</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o._id} className="bg-edit rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="font-bold">{o.fullName}</span>
                <span className="font-bold"><Money value={o.cost} /></span>
              </div>
              <p className="text-sm">{o.address}</p>
              {o.description && <p className="text-sm opacity-80">{o.description}</p>}
              <div className="flex gap-2 text-sm">
                <a href={`tel:${o.phone}`} className="bg-blue-600 px-3 py-1 rounded" dir="ltr">📞 {o.phone}</a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`} target="_blank" rel="noreferrer" className="bg-gray-600 px-3 py-1 rounded">🗺️ الخريطة</a>
                <span className="opacity-70 self-center" dir="ltr">{o.barcode}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {OUTCOMES.map((outcome) => (
                  <button key={outcome.status} disabled={busy === o._id} onClick={() => act(o, outcome)} className={`${outcome.className} rounded py-2 text-sm disabled:opacity-50`}>
                    {statusLabel(outcome.status)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PortalLayout>
  );
}
