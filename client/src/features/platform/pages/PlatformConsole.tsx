import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, Inbox, LogOut, Plus, ScrollText } from "lucide-react";
import { PLAN_LIMITS, type Plan, type TenantStatus } from "@masar/shared";
import type { TenantRow, AccessRequestRow, PageMeta } from "@/lib/types";
import {
  getTenants,
  createTenant,
  updateTenant,
  getAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  getPlatformAuditLogs,
  type PlatformAdmin,
} from "@/features/platform/api/platform-api";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Panel, PageHeader } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Overlay";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Status";
import Pagination from "@/components/ui/Pagination";
import { useFeedback } from "@/components/ui/feedback-context";
import { SecretReveal } from "@/components/forms/SecretReveal";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format-date";

const PLAN_LABELS: Record<Plan, string> = { trial: "تجريبية", starter: "أساسية", pro: "احترافية" };
const TENANT_STATUS: Record<TenantStatus, { label: string; tone: "info" | "ok" | "danger" }> = {
  trial: { label: "فترة تجريبية", tone: "info" },
  active: { label: "نشطة", tone: "ok" },
  suspended: { label: "موقوفة", tone: "danger" },
};
const REQUEST_STATUS: Record<AccessRequestRow["status"], string> = { pending: "قيد المراجعة", approved: "مقبولة", rejected: "مرفوضة" };
const TABS = { tenants: "الشركات", requests: "طلبات الانضمام", audit: "سجل المنصة" };
type Tab = keyof typeof TABS;
type Credentials = { email: string; password: string };

const limit = (n: number | null) => (n === null ? "بلا حد" : n.toLocaleString("en"));

export default function PlatformConsole({ admin, onLogout }: { admin: PlatformAdmin; onLogout(): void }) {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") as Tab | null;
  const tab: Tab = requested && requested in TABS ? requested : "tenants";
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-rail text-rail-ink">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Logo className="text-white" subtitle="إدارة المنصة" />
          <div className="ms-auto flex items-center gap-2">
            <span className="hidden text-sm sm:inline">{admin.email}</span>
            <ThemeToggle className="text-rail-ink" />
            <Button variant="quiet" size="sm" className="text-rail-ink hover:bg-white/10" icon={<LogOut className="size-4" />} aria-label="تسجيل الخروج" title="تسجيل الخروج" onClick={onLogout} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs className="mb-5" value={tab} onChange={(t) => setParams({ tab: t })} tabs={(Object.keys(TABS) as Tab[]).map((t) => ({ value: t, label: TABS[t] }))} />
        {tab === "tenants" && <Tenants onCreated={setCredentials} />}
        {tab === "requests" && <Requests onApproved={setCredentials} />}
        {tab === "audit" && <Audit />}
      </main>

      <Modal
        open={!!credentials}
        onClose={() => setCredentials(null)}
        title="بيانات دخول مالك الشركة"
        footer={<Button onClick={() => setCredentials(null)}>تم</Button>}
      >
        {credentials && (
          <div className="space-y-4">
            <p className="text-sm text-ink-2">
              البريد: <span dir="ltr" className="text-ink">{credentials.email}</span>
            </p>
            <SecretReveal label="كلمة المرور المؤقتة" value={credentials.password} note="تظهر مرة واحدة فقط. أرسلها للمالك، وسيُطلب منه تغييرها عند أول دخول." />
          </div>
        )}
      </Modal>
    </div>
  );
}

function usePaged<T>(load: (page: number) => Promise<{ data: T[]; meta: PageMeta }>, deps: unknown[]) {
  const { toast } = useFeedback();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: T[]; pages: number; total: number } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    load(page)
      .then(({ data, meta }) => setResult({ items: data, pages: meta.pages, total: meta.total }))
      .catch((err) => toast(errorMessage(err), "danger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reloadKey, ...deps]);
  return { result, page, setPage, reload: () => setReloadKey((k) => k + 1) };
}

function Tenants({ onCreated }: { onCreated(c: Credentials): void }) {
  const { toast, confirm } = useFeedback();
  const list = usePaged((page: number) => getTenants({ page }), []);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ name: string; ownerEmail: string; plan: Plan }>({ name: "", ownerEmail: "", plan: "trial" });

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { owner, initialPassword } = await createTenant(form);
      setAdding(false);
      setForm({ name: "", ownerEmail: "", plan: "trial" });
      onCreated({ email: owner.email, password: initialPassword });
      list.reload();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };

  const change = async (tenant: TenantRow, body: { plan?: Plan; status?: TenantStatus }) => {
    if (body.status === "suspended" && !(await confirm({ title: `إيقاف ${tenant.name}؟`, description: "سيُسجَّل خروج كل مستخدمي الشركة وتتوقف مفاتيح API الخاصة بتجارها حتى تُعاد إلى العمل.", confirmLabel: "إيقاف الشركة", danger: true }))) return;
    try {
      await updateTenant(tenant._id, body);
      toast(body.plan ? `تم تغيير باقة ${tenant.name}` : body.status === "suspended" ? `تم إيقاف ${tenant.name}` : `أُعيدت ${tenant.name} إلى العمل`);
      list.reload();
    } catch (err) {
      toast(errorMessage(err), "danger");
    }
  };

  return (
    <>
      <PageHeader
        title="الشركات"
        description={list.result && <><span className="num">{list.result.total}</span> شركة على المنصة</>}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>إضافة شركة</Button>}
      />
      <Panel>
        <DataTable
          caption="الشركات"
          loading={!list.result}
          rows={list.result?.items ?? []}
          rowKey={(t) => t._id}
          columns={[
            { key: "name", header: "الشركة", primary: true, cell: (t) => <div className="leading-tight"><div className="font-medium text-ink">{t.name}</div><div dir="ltr" className="num text-xs text-ink-3 text-start">{t.slug}</div></div> },
            { key: "status", header: "الحالة", cell: (t) => <Badge tone={TENANT_STATUS[t.status].tone}>{TENANT_STATUS[t.status].label}</Badge> },
            {
              key: "plan",
              header: "الباقة",
              cell: (t) => (
                <Select className="h-8 w-32 text-sm" aria-label={`باقة ${t.name}`} value={t.plan} onChange={(e) => change(t, { plan: e.target.value as Plan })}>
                  {(Object.keys(PLAN_LABELS) as Plan[]).map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
                </Select>
              ),
            },
            { key: "trial", header: "نهاية التجربة", hideOnMobile: true, cell: (t) => <span className="num text-ink-2">{t.trialEndsAt ? formatDate(t.trialEndsAt) : "—"}</span> },
            { key: "limits", header: "الحدود", hideOnMobile: true, cell: (t) => <span className="text-xs text-ink-2"><span className="num">{limit(t.limits?.maxUsers ?? null)}</span> مستخدم، <span className="num">{limit(t.limits?.maxOrdersPerMonth ?? null)}</span> شحنة شهريًا</span> },
            { key: "created", header: "أُضيفت", hideOnMobile: true, cell: (t) => <span className="num text-ink-3">{formatDate(t.createdAt)}</span> },
          ]}
          rowActions={(t) =>
            t.status === "suspended" ? (
              <Button size="sm" variant="secondary" onClick={() => change(t, { status: "active" })}>إعادة التفعيل</Button>
            ) : (
              <Button size="sm" variant="quiet" className="text-stamp" onClick={() => change(t, { status: "suspended" })}>إيقاف</Button>
            )
          }
          empty={{ icon: <Building2 />, title: "لا توجد شركات بعد", description: "أضف أول شركة أو اقبل طلب انضمام." }}
        />
        {list.result && <Pagination page={list.page} pages={list.result.pages} onChange={list.setPage} />}
      </Panel>

      <Modal open={adding} onClose={() => setAdding(false)} title="إضافة شركة" description="يُنشأ حساب للمالك بكلمة مرور مؤقتة تظهر لك مرة واحدة.">
        <form onSubmit={create} className="space-y-4">
          <Field label="اسم الشركة">{(p) => <Input {...p} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
          <Field label="بريد المالك">{(p) => <Input {...p} required type="email" dir="ltr" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />}</Field>
          <PlanField value={form.plan} onChange={(plan) => setForm({ ...form, plan })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAdding(false)}>إلغاء</Button>
            <Button type="submit" loading={saving}>إضافة الشركة</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function PlanField({ value, onChange }: { value: Plan; onChange(p: Plan): void }) {
  const l = PLAN_LIMITS[value];
  return (
    <Field label="الباقة" hint={`${limit(l.maxUsers)} مستخدم، ${limit(l.maxOrdersPerMonth)} شحنة شهريًا`}>
      {(p) => (
        <Select {...p} value={value} onChange={(e) => onChange(e.target.value as Plan)}>
          {(Object.keys(PLAN_LABELS) as Plan[]).map((plan) => <option key={plan} value={plan}>{PLAN_LABELS[plan]}</option>)}
        </Select>
      )}
    </Field>
  );
}

function Requests({ onApproved }: { onApproved(c: Credentials): void }) {
  const { toast } = useFeedback();
  const [status, setStatus] = useState<AccessRequestRow["status"]>("pending");
  const list = usePaged((page: number) => getAccessRequests({ page, status }), [status]);
  const [approving, setApproving] = useState<AccessRequestRow | null>(null);
  const [plan, setPlan] = useState<Plan>("trial");
  const [rejecting, setRejecting] = useState<AccessRequestRow | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const approve = async (e: FormEvent) => {
    e.preventDefault();
    if (!approving) return;
    try {
      setSaving(true);
      const { owner, initialPassword } = await approveAccessRequest(approving._id, { plan });
      setApproving(null);
      onApproved({ email: owner.email, password: initialPassword });
      list.reload();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };

  const reject = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejecting) return;
    try {
      setSaving(true);
      await rejectAccessRequest(rejecting._id, reason.trim() || undefined);
      toast(`تم رفض طلب ${rejecting.companyName}`);
      setRejecting(null);
      list.reload();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="طلبات الانضمام"
        description="الطلبات القادمة من صفحة مسار العامة."
        actions={
          <Select className="w-40" aria-label="حالة الطلب" value={status} onChange={(e) => { setStatus(e.target.value as AccessRequestRow["status"]); list.setPage(1); }}>
            {(Object.keys(REQUEST_STATUS) as AccessRequestRow["status"][]).map((s) => <option key={s} value={s}>{REQUEST_STATUS[s]}</option>)}
          </Select>
        }
      />
      <Panel>
        <DataTable
          caption="طلبات الانضمام"
          loading={!list.result}
          rows={list.result?.items ?? []}
          rowKey={(r) => r._id}
          columns={[
            { key: "company", header: "الشركة", primary: true, cell: (r) => <div className="leading-tight"><div className="font-medium text-ink">{r.companyName}</div><div className="text-xs text-ink-3">{r.contactName}</div></div> },
            { key: "contact", header: "التواصل", cell: (r) => <div dir="ltr" className="num text-start text-sm leading-tight text-ink-2"><div>{r.email}</div><div>{r.phone}</div></div> },
            { key: "message", header: "الرسالة", hideOnMobile: true, cell: (r) => <span className="line-clamp-2 max-w-72 text-ink-2">{r.message || "—"}</span> },
            { key: "date", header: "التاريخ", cell: (r) => <span className="num text-ink-3">{formatDate(r.createdAt)}</span> },
          ]}
          rowActions={(r) =>
            r.status === "pending" && (
              <div className="flex gap-1">
                <Button size="sm" onClick={() => { setPlan("trial"); setApproving(r); }}>قبول</Button>
                <Button size="sm" variant="quiet" className="text-stamp" onClick={() => { setReason(""); setRejecting(r); }}>رفض</Button>
              </div>
            )
          }
          empty={{ icon: <Inbox />, title: status === "pending" ? "لا توجد طلبات جديدة" : "لا توجد طلبات بهذه الحالة" }}
        />
        {list.result && <Pagination page={list.page} pages={list.result.pages} onChange={list.setPage} />}
      </Panel>

      <Modal open={!!approving} onClose={() => setApproving(null)} title={`قبول ${approving?.companyName ?? ""}`} description={approving && <>يُنشأ حساب المالك على <span dir="ltr">{approving.email}</span>.</>}>
        <form onSubmit={approve} className="space-y-4">
          <PlanField value={plan} onChange={setPlan} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setApproving(null)}>إلغاء</Button>
            <Button type="submit" loading={saving}>قبول وإنشاء الشركة</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={`رفض طلب ${rejecting?.companyName ?? ""}`}>
        <form onSubmit={reject} className="space-y-4">
          <Field label="السبب" hint="اختياري، يُحفظ مع الطلب">{(p) => <Textarea {...p} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRejecting(null)}>إلغاء</Button>
            <Button type="submit" variant="danger" loading={saving}>رفض الطلب</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

const ACTIONS: Record<string, string> = {
  LOGIN: "تسجيل دخول",
  LOGIN_FAILED: "محاولة دخول فاشلة",
  CHANGE_OWN_PASSWORD: "تغيير كلمة المرور",
  VIEW: "عرض بيانات",
  CREATE_TENANT: "إضافة شركة",
  UPDATE_TENANT: "تعديل شركة",
  APPROVE_ACCESS_REQUEST: "قبول طلب انضمام",
  REJECT_ACCESS_REQUEST: "رفض طلب انضمام",
};

// Read audits store the API path as their target; show the screen it belongs to instead.
const VIEWED: [RegExp, string][] = [
  [/^\/platform\/tenants/, "قائمة الشركات"],
  [/^\/platform\/access-requests/, "طلبات الانضمام"],
  [/^\/platform\/audit-logs/, "سجل المنصة"],
];
const targetLabel = (label?: string) => (label && VIEWED.find(([re]) => re.test(label))?.[1]) || label || "—";

function Audit() {
  const list = usePaged((page: number) => getPlatformAuditLogs({ page, limit: 30 }), []);
  return (
    <>
      <PageHeader title="سجل المنصة" description="كل إجراء قام به مسؤولو المنصة." />
      <Panel>
        <DataTable
          caption="سجل المنصة"
          loading={!list.result}
          rows={list.result?.items ?? []}
          rowKey={(e) => e._id}
          columns={[
            { key: "action", header: "الإجراء", primary: true, cell: (e) => <span className="font-medium text-ink">{ACTIONS[e.action] ?? e.action}</span> },
            { key: "target", header: "على", cell: (e) => <span dir="auto" className="text-ink-2">{targetLabel(e.target?.label)}</span> },
            { key: "actor", header: "بواسطة", cell: (e) => <span dir="ltr" className="text-ink-2">{e.actor?.email || "—"}</span> },
            { key: "ip", header: "IP", hideOnMobile: true, cell: (e) => <span dir="ltr" className="num text-ink-3">{e.ip || "—"}</span> },
            { key: "at", header: "الوقت", cell: (e) => <span className="num text-ink-3">{formatDateTime(e.createdAt)}</span> },
          ]}
          empty={{ icon: <ScrollText />, title: "السجل فارغ" }}
        />
        {list.result && <Pagination page={list.page} pages={list.result.pages} onChange={list.setPage} />}
      </Panel>
    </>
  );
}
