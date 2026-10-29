import type { Plan, TenantStatus } from "@masar/shared";
import type { TenantRow, AccessRequestRow, PageMeta } from "@/lib/types";
import type { PlatformAdmin } from "@/features/platform/api/platform-api";
import { useEffect, useState, type FormEvent } from "react";
import {
  getTenants,
  createTenant,
  updateTenant,
  getAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  getPlatformAuditLogs,
} from "@/features/platform/api/platform-api";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format-date";
import Pagination from "@/components/ui/Pagination";

const PLAN_LABELS: Record<Plan, string> = { trial: "تجريبي", starter: "أساسي", pro: "احترافي" };
const STATUS_LABELS: Record<string, string> = { trial: "تجريبي", active: "نشط", suspended: "موقوف", pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" };
const TABS = { tenants: "الشركات", requests: "طلبات الانضمام", audit: "سجل المنصة" };

// Functional platform console; the visual design comes in Phase E.
type Credentials = { email: string; password: string };

export default function PlatformConsole({ admin, onLogout }: { admin: PlatformAdmin; onLogout(): void }) {
  const [tab, setTab] = useState<keyof typeof TABS>("tenants");
  const [credentials, setCredentials] = useState<Credentials | null>(null); // shown once

  return (
    <div className="min-h-screen bg-main text-white p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة المنصة</h1>
        <div className="flex gap-4 items-center">
          <span className="text-sm">{admin.email}</span>
          <button onClick={onLogout} className="bg-red-600 px-3 py-1 rounded">تسجيل الخروج</button>
        </div>
      </header>

      <nav className="flex gap-2">
        {Object.entries(TABS).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as keyof typeof TABS)} className={`px-4 py-2 rounded ${tab === key ? "bg-orange" : "bg-edit"}`}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "tenants" && <Tenants onCreated={setCredentials} />}
      {tab === "requests" && <Requests onApproved={setCredentials} />}
      {tab === "audit" && <Audit />}

      {credentials && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[460px] space-y-3">
            <h3 className="text-xl font-bold">بيانات دخول المالك</h3>
            <p className="text-yellow-400 text-sm">الباسورد يظهر مرة واحدة فقط. أرسله للمالك ليغيّره بعد أول دخول.</p>
            <code className="block bg-gray-800 p-3 rounded break-all select-all" dir="ltr">{credentials.email}<br />{credentials.password}</code>
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-gray-600 rounded" onClick={() => setCredentials(null)}>تم</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function usePaged<T>(load: (page: number) => Promise<{ data: T[]; meta: PageMeta }>, deps: unknown[]) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: T[]; pages: number }>({ items: [], pages: 0 });
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    load(page)
      .then(({ data, meta }) => setResult({ items: data, pages: meta.pages }))
      .catch((err) => alert(errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reloadKey, ...deps]);
  return { ...result, page, setPage, reload: () => setReloadKey((k) => k + 1) };
}

function Tenants({ onCreated }: { onCreated(c: Credentials): void }) {
  const list = usePaged((page: number) => getTenants({ page }), []);
  const [form, setForm] = useState<{ name: string; ownerEmail: string; plan: Plan }>({ name: "", ownerEmail: "", plan: "trial" });

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { owner, initialPassword } = await createTenant(form);
      onCreated({ email: owner.email, password: initialPassword });
      setForm({ name: "", ownerEmail: "", plan: "trial" });
      list.reload();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const change = async (tenant: TenantRow, body: { plan?: Plan; status?: TenantStatus }) => {
    if (body.status === "suspended" && !window.confirm(`إيقاف ${tenant.name}؟ سيتم تسجيل خروج كل المستخدمين وإيقاف مفاتيح API.`)) return;
    try {
      await updateTenant(tenant._id, body);
      list.reload();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="flex gap-3 flex-wrap items-center">
        <input required placeholder="اسم الشركة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded p-2 text-black bg-white" />
        <input required type="email" placeholder="إيميل المالك" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} className="border rounded p-2 text-black bg-white" />
        <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as Plan })} className="border rounded p-2 text-black bg-white">
          {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="bg-green-600 px-4 py-2 rounded">إضافة شركة</button>
      </form>

      <table className="w-full text-center text-sm border">
        <thead className="bg-gray-800">
          <tr>{["الشركة", "المعرّف", "الباقة", "الحالة", "نهاية التجربة", "حد المستخدمين", "حد الأوردرات/شهر", ""].map((h) => <th key={h} className="p-2 border">{h}</th>)}</tr>
        </thead>
        <tbody>
          {list.items.map((t) => (
            <tr key={t._id} className="border-b">
              <td className="p-2">{t.name}</td>
              <td className="p-2" dir="ltr">{t.slug}</td>
              <td className="p-2">
                <select value={t.plan} onChange={(e) => change(t, { plan: e.target.value as Plan })} className="text-black bg-white rounded p-1">
                  {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </td>
              <td className="p-2">{STATUS_LABELS[t.status]}</td>
              <td className="p-2">{t.trialEndsAt ? formatDate(t.trialEndsAt) : "-"}</td>
              <td className="p-2">{t.limits?.maxUsers ?? "∞"}</td>
              <td className="p-2">{t.limits?.maxOrdersPerMonth ?? "∞"}</td>
              <td className="p-2">
                {t.status === "suspended" ? (
                  <button onClick={() => change(t, { status: "active" })} className="bg-green-600 px-2 py-1 rounded">تفعيل</button>
                ) : (
                  <button onClick={() => change(t, { status: "suspended" })} className="bg-red-600 px-2 py-1 rounded">إيقاف</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={list.page} pages={list.pages} onChange={list.setPage} />
    </div>
  );
}

function Requests({ onApproved }: { onApproved(c: Credentials): void }) {
  const [status, setStatus] = useState<AccessRequestRow["status"]>("pending");
  const list = usePaged((page: number) => getAccessRequests({ page, status }), [status]);

  const approve = async (r: AccessRequestRow) => {
    try {
      const { owner, initialPassword } = await approveAccessRequest(r._id);
      onApproved({ email: owner.email, password: initialPassword });
      list.reload();
    } catch (err) {
      alert(errorMessage(err));
    }
  };
  const reject = async (r: AccessRequestRow) => {
    const reason = window.prompt("سبب الرفض (اختياري)") ?? undefined;
    try {
      await rejectAccessRequest(r._id, reason || undefined);
      list.reload();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <select value={status} onChange={(e) => { setStatus(e.target.value as AccessRequestRow["status"]); list.setPage(1); }} className="border rounded p-2 text-black bg-white">
        {["pending", "approved", "rejected"].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      <table className="w-full text-center text-sm border">
        <thead className="bg-gray-800">
          <tr>{["الشركة", "المسؤول", "الهاتف", "الإيميل", "رسالة", "التاريخ", ""].map((h) => <th key={h} className="p-2 border">{h}</th>)}</tr>
        </thead>
        <tbody>
          {list.items.map((r) => (
            <tr key={r._id} className="border-b">
              <td className="p-2">{r.companyName}</td>
              <td className="p-2">{r.contactName}</td>
              <td className="p-2" dir="ltr">{r.phone}</td>
              <td className="p-2" dir="ltr">{r.email}</td>
              <td className="p-2">{r.message || "-"}</td>
              <td className="p-2">{formatDate(r.createdAt)}</td>
              <td className="p-2 space-x-2 space-x-reverse">
                {r.status === "pending" && (
                  <>
                    <button onClick={() => approve(r)} className="bg-green-600 px-2 py-1 rounded">قبول</button>
                    <button onClick={() => reject(r)} className="bg-red-600 px-2 py-1 rounded">رفض</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={list.page} pages={list.pages} onChange={list.setPage} />
    </div>
  );
}

function Audit() {
  const list = usePaged((page: number) => getPlatformAuditLogs({ page, limit: 30 }), []);
  return (
    <div>
      <table className="w-full text-center text-sm border">
        <thead className="bg-gray-800">
          <tr>{["العملية", "الهدف", "بواسطة", "IP", "التاريخ"].map((h) => <th key={h} className="p-2 border">{h}</th>)}</tr>
        </thead>
        <tbody>
          {list.items.map((e) => (
            <tr key={e._id} className="border-b">
              <td className="p-2" dir="ltr">{e.action}</td>
              <td className="p-2" dir="auto">{e.target?.label || "-"}</td>
              <td className="p-2">{e.actor?.email || "-"}</td>
              <td className="p-2" dir="ltr">{e.ip || "-"}</td>
              <td className="p-2">{new Date(e.createdAt).toLocaleString("ar-EG")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={list.page} pages={list.pages} onChange={list.setPage} />
    </div>
  );
}
