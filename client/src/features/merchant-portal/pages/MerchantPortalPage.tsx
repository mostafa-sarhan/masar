import type { ChangeEvent } from "react";
import type { PortalOrder, PortalStatement } from "@/lib/types";
import { useEffect, useState, type FormEvent } from "react";
import PortalLayout from "@/app/layouts/PortalLayout";
import Money from "@/components/ui/Money";
import Pagination from "@/components/ui/Pagination";
import { getPortalOrders, createPortalOrder, getPortalStatement, getPortalApiKey, rotatePortalApiKey, getPortalOrder } from "@/lib/portals-api";
import { trackingUrl } from "@/features/orders/api/orders-api";
import StatusTimeline from "@/features/orders/components/StatusTimeline";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format-date";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";
import { toLatinDigits } from "@/lib/digits";

const TABS = { orders: "طلباتي", create: "طلب جديد", statement: "كشف الحساب", api: "ربط API" };
const field = "border rounded p-2 text-black bg-white";

export default function MerchantPortal() {
  const [tab, setTab] = useState<keyof typeof TABS>("orders");
  return (
    <PortalLayout title="بوابة التاجر">
      <nav className="flex gap-2 mb-4 flex-wrap">
        {Object.entries(TABS).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as keyof typeof TABS)} className={`px-4 py-2 rounded ${tab === key ? "bg-orange" : "bg-edit"}`}>{label}</button>
        ))}
      </nav>
      {tab === "orders" && <OrdersTab />}
      {tab === "create" && <CreateTab onCreated={() => setTab("orders")} />}
      {tab === "statement" && <StatementTab />}
      {tab === "api" && <ApiTab />}
    </PortalLayout>
  );
}

function OrdersTab() {
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: PortalOrder[]; pages: number; total: number }>({ items: [], pages: 0, total: 0 });
  const [details, setDetails] = useState<PortalOrder | null>(null);

  useEffect(() => {
    getPortalOrders({ ...filters, page, limit: 20 })
      .then(({ data, meta }) => setResult({ items: data, ...meta }))
      .catch((err) => alert(errorMessage(err)));
  }, [filters, page]);

  const setFilter = (name: "status" | "search") => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((f) => ({ ...f, [name]: name === "search" ? toLatinDigits(e.target.value).replace(/[^\d]/g, "") : e.target.value }));
    setPage(1);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        <input placeholder="بحث برقم الهاتف أو الباركود" value={filters.search} onChange={setFilter("search")} className={field} />
        <select value={filters.status} onChange={setFilter("status")} className={field}>
          <option value="">كل الحالات</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <span className="self-center">العدد: {result.total}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm border">
          <thead className="bg-gray-800">
            <tr>{["التاريخ", "الباركود", "مرجعك", "العميل", "العنوان", "المبلغ", "الحالة", "السبب"].map((h) => <th key={h} className="p-2 border">{h}</th>)}</tr>
          </thead>
          <tbody>
            {result.items.map((o) => (
              <tr key={o._id} className="border-b cursor-pointer hover:bg-gray-800" onClick={() => getPortalOrder(o._id).then(setDetails).catch((err) => alert(errorMessage(err)))}>
                <td className="p-2">{formatDate(o.createdAt)}</td>
                <td className="p-2" dir="ltr">{o.barcode}</td>
                <td className="p-2" dir="ltr">{o.merchantRef || "-"}</td>
                <td className="p-2">{o.fullName}<br /><span dir="ltr">{o.phone}</span></td>
                <td className="p-2">{o.address}</td>
                <td className="p-2"><Money value={o.cost} /></td>
                <td className="p-2">{statusLabel(o.status)}</td>
                <td className="p-2">{o.reason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={result.pages} onChange={setPage} />

      {details && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setDetails(null)}>
          <aside className="bg-edit w-full md:w-[420px] h-full overflow-y-auto p-6 space-y-4 text-start" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between"><h3 className="text-xl font-bold">{details.fullName}</h3><button onClick={() => setDetails(null)}>✕</button></div>
            <p dir="ltr" className="text-xs break-all">{trackingUrl(details.trackingId)}</p>
            <StatusTimeline events={details.statusHistory} />
          </aside>
        </div>
      )}
    </div>
  );
}

function CreateTab({ onCreated }: { onCreated(): void }) {
  const empty = { fullName: "", phone: "", address: "", cost: "", description: "" };
  const [form, setForm] = useState(empty);
  const set = (name: keyof typeof empty, transform: (v: string) => string = (v) => v) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [name]: transform(e.target.value) }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const order = await createPortalOrder({ ...form, cost: Number(form.cost), description: form.description || undefined });
      alert(`تم إنشاء الطلب ✅ الباركود: ${order.barcode}`);
      setForm(empty);
      onCreated();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-md">
      <input required placeholder="اسم العميل" value={form.fullName} onChange={set("fullName")} className={field} />
      <input required placeholder="رقم الهاتف" value={form.phone} onChange={set("phone", toLatinDigits)} className={field} dir="ltr" />
      <input required placeholder="العنوان" value={form.address} onChange={set("address")} className={field} />
      <input required placeholder="المبلغ" value={form.cost} onChange={set("cost", toLatinDigits)} className={field} dir="ltr" />
      <textarea placeholder="ملاحظات" value={form.description} onChange={set("description")} className={field} />
      <button className="bg-blue-600 py-2 rounded">إنشاء</button>
    </form>
  );
}

function StatementTab() {
  const [range, setRange] = useState({ from: "", to: "" });
  const [s, setS] = useState<PortalStatement | null>(null);

  useEffect(() => {
    getPortalStatement(range).then(setS).catch((err) => alert(errorMessage(err)));
  }, [range]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <label>من <input type="date" className={field} value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
        <label>إلى <input type="date" className={field} value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
      </div>
      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {ORDER_STATUSES.map((st) => (
            <div key={st} className="bg-edit rounded p-3"><p className="text-sm">{statusLabel(st)}</p><p className="text-xl font-bold">{s.byStatus[st]?.count ?? 0}</p></div>
          ))}
          <div className="bg-edit rounded p-3"><p className="text-sm">إجمالي المسلّم</p><p className="font-bold"><Money value={s.money.deliveredTotal} /></p></div>
          {s.money.deductions.company !== undefined && <div className="bg-edit rounded p-3"><p className="text-sm">عمولة الشحن</p><p className="font-bold"><Money value={s.money.deductions.company} /></p></div>}
          {s.money.deductions.courier !== undefined && <div className="bg-edit rounded p-3"><p className="text-sm">عمولة المندوب</p><p className="font-bold"><Money value={s.money.deductions.courier} /></p></div>}
          <div className="bg-green-700 rounded p-3"><p className="text-sm">صافي مستحقاتك</p><p className="text-xl font-bold"><Money value={s.money.merchantNet} /></p></div>
        </div>
      )}
    </div>
  );
}

function ApiTab() {
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getPortalApiKey>> | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    getPortalApiKey().then(setInfo).catch((err) => alert(errorMessage(err)));
  }, [newKey]);

  const rotate = async () => {
    if (info?.hasActiveKey && !window.confirm("سيتوقف المفتاح الحالي فورًا. متابعة؟")) return;
    try {
      setNewKey((await rotatePortalApiKey()).apiKey);
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <div className="space-y-3 max-w-xl">
      <p>أرسل الطلبات من نظامك إلى <code dir="ltr">POST /merchants/order</code> مع الهيدر <code dir="ltr">api-key</code>.</p>
      <p>المفتاح الحالي: <span dir="ltr">{info?.hasActiveKey ? `${info.apiKeyPrefix}…` : "لا يوجد"}</span></p>
      <button onClick={rotate} className="bg-blue-600 px-4 py-2 rounded">{info?.hasActiveKey ? "تغيير المفتاح" : "إنشاء مفتاح"}</button>
      {newKey && (
        <div className="bg-gray-900 p-3 rounded space-y-2">
          <p className="text-yellow-400 text-sm">انسخ المفتاح الآن، لن يظهر مرة أخرى.</p>
          <code className="block break-all select-all" dir="ltr">{newKey}</code>
        </div>
      )}
    </div>
  );
}
