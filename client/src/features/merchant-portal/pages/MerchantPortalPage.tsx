import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, KeyRound, PackageSearch, Search } from "lucide-react";
import type { PortalOrder, PortalStatement } from "@/lib/types";
import PortalLayout from "@/app/layouts/PortalLayout";
import Money from "@/components/ui/Money";
import Pagination from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
import { Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import StatusSelect from "@/features/orders/components/StatusSelect";
import { GovernorateSelect, CitySelect } from "@/features/locations/components/PlaceSelects";
import { useShippingQuote } from "@/features/zones/hooks/use-shipping-quote";
import { ShippingQuoteNote } from "@/features/zones/components/ShippingQuoteNote";
import { placeLabel } from "@masar/shared";
import { DateRange, type Range } from "@/components/ui/DateRange";
import { StatusBadge } from "@/components/ui/Status";
import { Skeleton } from "@/components/ui/Feedback";
import { useFeedback } from "@/components/ui/feedback-context";
import { SecretReveal } from "@/components/forms/SecretReveal";
import { MoneyTiles } from "@/features/reports/components/MoneyTiles";
import { getPortalOrders, getPortalQuote, createPortalOrder, getPortalStatement, getPortalApiKey, rotatePortalApiKey, getPortalOrder } from "@/lib/portals-api";
import { trackingUrl } from "@/features/orders/api/orders-api";
import StatusTimeline from "@/features/orders/components/StatusTimeline";
import { useDebounced } from "@/lib/use-debounced";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format-date";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";
import { toLatinDigits } from "@/lib/digits";

const TABS = { orders: "شحناتي", create: "شحنة جديدة", statement: "كشف الحساب", api: "الربط عبر API" };
type Tab = keyof typeof TABS;

export default function MerchantPortalPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") as Tab | null;
  const tab: Tab = requested && requested in TABS ? requested : "orders";
  const go = (t: Tab) => setParams({ tab: t });
  return (
    <PortalLayout title="بوابة التاجر">
      <Tabs className="mb-5" value={tab} onChange={go} tabs={(Object.keys(TABS) as Tab[]).map((t) => ({ value: t, label: TABS[t] }))} />
      {tab === "orders" && <OrdersTab />}
      {tab === "create" && <CreateTab onCreated={() => go("orders")} />}
      {tab === "statement" && <StatementTab />}
      {tab === "api" && <ApiTab />}
    </PortalLayout>
  );
}

function OrdersTab() {
  const { toast } = useFeedback();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: PortalOrder[]; pages: number; total: number } | null>(null);
  const [details, setDetails] = useState<PortalOrder | null>(null);
  const debouncedSearch = useDebounced(search, 350);

  useEffect(() => {
    getPortalOrders({ status, governorate, search: debouncedSearch, page, limit: 20 })
      .then(({ data, meta }) => setResult({ items: data, ...meta }))
      .catch((err) => toast(errorMessage(err), "danger"));
  }, [status, governorate, debouncedSearch, page, toast]);

  const open = (o: PortalOrder) => getPortalOrder(o._id).then(setDetails).catch((err) => toast(errorMessage(err), "danger"));

  return (
    <div className="space-y-4">
      <Panel bodyClassName="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            className="ps-9"
            placeholder="رقم الهاتف أو الباركود"
            aria-label="بحث"
            inputMode="numeric"
            value={search}
            onChange={(e) => {
              setSearch(toLatinDigits(e.target.value).replace(/[^\d]/g, ""));
              setPage(1);
            }}
          />
        </div>
        <StatusSelect
          className="w-full sm:w-44"
          aria-label="الحالة"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <GovernorateSelect
          className="w-full sm:w-44"
          aria-label="المحافظة"
          value={governorate}
          onChange={(v) => {
            setGovernorate(v);
            setPage(1);
          }}
        />
        {result && <span className="ms-auto text-sm text-ink-2"><span className="num">{result.total}</span> شحنة</span>}
      </Panel>

      <Panel>
        <DataTable
          caption="شحناتي"
          loading={!result}
          rows={result?.items ?? []}
          rowKey={(o) => o._id}
          onRowClick={open}
          columns={[
            {
              key: "barcode",
              header: "الشحنة",
              primary: true,
              cell: (o) => (
                <div className="leading-tight">
                  <div className="num font-medium text-ink">{o.barcode}</div>
                  {o.merchantRef && <div className="num text-xs text-ink-3" dir="ltr">{o.merchantRef}</div>}
                </div>
              ),
            },
            { key: "customer", header: "العميل", cell: (o) => <div className="leading-tight"><div className="text-ink">{o.fullName}</div><div className="num text-xs text-ink-3" dir="ltr">{o.phone}</div></div> },
            {
              key: "address",
              header: "الوجهة",
              hideOnMobile: true,
              cell: (o) => (
                <div className="max-w-56 leading-tight">
                  {o.governorate && <div className="text-ink">{placeLabel(o.governorate, o.city)}</div>}
                  <div className="line-clamp-2 text-xs text-ink-3">{o.address}</div>
                </div>
              ),
            },
            { key: "status", header: "الحالة", cell: (o) => <div><StatusBadge status={o.status} />{o.reason && <div className="mt-1 text-xs text-ink-3">{o.reason}</div>}</div> },
            { key: "cost", header: "المبلغ", align: "end", cell: (o) => <span className="font-medium text-ink"><Money value={o.cost} /></span> },
            { key: "date", header: "التاريخ", hideOnMobile: true, cell: (o) => <span className="num text-ink-3">{formatDate(o.createdAt)}</span> },
          ]}
          empty={{ icon: <PackageSearch />, title: "لا توجد شحنات", description: "أنشئ شحنة جديدة أو أرسلها من نظامك عبر API." }}
        />
        {result && <Pagination page={page} pages={result.pages} onChange={setPage} />}
      </Panel>

      <Drawer open={!!details} onClose={() => setDetails(null)} title={details?.fullName ?? ""} description={details && <span className="num">{details.barcode}</span>}>
        {details && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={details.status} pressed />
              <b className="text-lg text-ink"><Money value={details.cost} /></b>
            </div>
            <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-ink-3">الوجهة</dt>
              <dd className="text-ink">{placeLabel(details.governorate, details.city) || "—"}</dd>
              <dt className="text-ink-3">العنوان</dt>
              <dd className="text-ink">{details.address}</dd>
              <dt className="text-ink-3">سعر الشحن</dt>
              <dd className="text-ink">{details.shippingFee != null ? <Money value={details.shippingFee} /> : "حسب الاتفاق"}</dd>
            </dl>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">رابط التتبع للعميل</p>
              <div className="flex gap-2">
                <Input readOnly dir="ltr" value={trackingUrl(details.trackingId)} aria-label="رابط التتبع" />
                <TrackingCopy url={trackingUrl(details.trackingId)} />
              </div>
            </div>
            <StatusTimeline events={details.statusHistory} />
          </div>
        )}
      </Drawer>
    </div>
  );
}

function TrackingCopy({ url }: { url: string }) {
  const { toast } = useFeedback();
  return <Button variant="secondary" icon={<Copy className="size-4" />} aria-label="نسخ الرابط" onClick={() => navigator.clipboard?.writeText(url).then(() => toast("تم نسخ الرابط"))} />;
}

function CreateTab({ onCreated }: { onCreated(): void }) {
  const { toast } = useFeedback();
  const empty = { fullName: "", phone: "", governorate: "", city: "", address: "", cost: "", description: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const { quote, loading } = useShippingQuote(getPortalQuote, form.governorate, form.city);
  const set = (name: keyof typeof empty, transform: (v: string) => string = (v) => v) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [name]: transform(e.target.value) }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const order = await createPortalOrder({ ...form, cost: Number(form.cost), description: form.description || undefined });
      toast(`تم إنشاء الشحنة ${order.barcode}`);
      setForm(empty);
      onCreated();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="بيانات الشحنة" className="max-w-2xl">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم العميل">{(p) => <Input {...p} required value={form.fullName} onChange={set("fullName")} />}</Field>
        <Field label="رقم الهاتف">{(p) => <Input {...p} required dir="ltr" inputMode="tel" value={form.phone} onChange={set("phone", toLatinDigits)} />}</Field>
        <Field label="المحافظة">
          {(p) => <GovernorateSelect {...p} required value={form.governorate} onChange={(g) => setForm((f) => ({ ...f, governorate: g, city: g === f.governorate ? f.city : "" }))} />}
        </Field>
        <Field label="المدينة / المنطقة">{(p) => <CitySelect {...p} required governorate={form.governorate} value={form.city} onChange={(c) => setForm((f) => ({ ...f, city: c }))} />}</Field>
        <Field label="العنوان بالتفصيل" hint="الشارع، رقم العمارة، الدور، علامة مميزة" className="sm:col-span-2">{(p) => <Input {...p} required value={form.address} onChange={set("address")} />}</Field>
        <p className="text-sm text-ink-2 sm:col-span-2">
          <ShippingQuoteNote quote={quote} loading={loading} governorate={form.governorate} />
        </p>
        <Field label="المبلغ المطلوب تحصيله" hint="شامل قيمة المنتج">{(p) => <Input {...p} required dir="ltr" inputMode="decimal" value={form.cost} onChange={set("cost", toLatinDigits)} />}</Field>
        <Field label="ملاحظات للمندوب" className="sm:col-span-2">{(p) => <Textarea {...p} rows={3} value={form.description} onChange={set("description")} />}</Field>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" loading={saving}>إنشاء الشحنة</Button>
        </div>
      </form>
    </Panel>
  );
}

function StatementTab() {
  const { toast } = useFeedback();
  const [range, setRange] = useState<Range>({ from: "", to: "" });
  const [s, setS] = useState<PortalStatement | null>(null);

  useEffect(() => {
    getPortalStatement(range).then(setS).catch((err) => toast(errorMessage(err), "danger"));
  }, [range, toast]);

  return (
    <div className="space-y-5">
      <Panel bodyClassName="flex flex-wrap items-center gap-3">
        <DateRange value={range} onChange={setRange} />
      </Panel>
      {!s ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <MoneyTiles
            items={[
              { label: "إجمالي ما سُلّم", value: s.money.deliveredTotal, hint: `${s.money.deliveredCount} شحنة` },
              ...(s.money.deductions.company !== undefined ? [{ label: "مصاريف الشحن", value: s.money.deductions.company }] : []),
              ...(s.money.deductions.courier !== undefined ? [{ label: "عمولة المندوب", value: s.money.deductions.courier }] : []),
              { label: "صافي مستحقاتك", value: s.money.merchantNet, strong: true },
            ]}
          />
          <Panel title="حسب الحالة">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {ORDER_STATUSES.map((st) => (
                <div key={st}>
                  <dt className="text-xs text-ink-2">{statusLabel(st)}</dt>
                  <dd className="num text-xl font-semibold text-ink">{s.byStatus[st]?.count ?? 0}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </>
      )}
    </div>
  );
}

function ApiTab() {
  const { toast, confirm } = useFeedback();
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getPortalApiKey>> | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPortalApiKey().then(setInfo).catch((err) => toast(errorMessage(err), "danger"));
  }, [newKey, toast]);

  const rotate = async () => {
    if (info?.hasActiveKey && !(await confirm({ title: "إنشاء مفتاح جديد؟", description: "سيتوقف المفتاح الحالي فورًا، ويجب تحديثه في نظامك.", confirmLabel: "إنشاء مفتاح جديد", danger: true }))) return;
    try {
      setBusy(true);
      setNewKey((await rotatePortalApiKey()).apiKey);
      toast("تم إنشاء المفتاح");
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <Panel title="إرسال الشحنات من نظامك">
        <div className="space-y-3 text-sm text-ink-2">
          <p>أرسل كل شحنة بطلب <code dir="ltr" className="rounded bg-sheet-2 px-1.5 py-0.5 text-ink">POST /merchants/order</code> مع المفتاح في الترويسة <code dir="ltr" className="rounded bg-sheet-2 px-1.5 py-0.5 text-ink">api-key</code>.</p>
          <pre dir="ltr" className="overflow-x-auto rounded-md bg-rail p-4 text-xs leading-relaxed text-rail-ink">{`curl -X POST $API/merchants/order \\
  -H "api-key: <YOUR_KEY>" \\
  -H "content-type: application/json" \\
  -d '{"fullName":"…","phone":"01…","address":"…","cost":250,"reference":"A-1001"}'`}</pre>
          <p>يمنع حقل <code dir="ltr">reference</code> (رقم الطلب في نظامك) تكرار نفس الشحنة إذا أُعيد الإرسال.</p>
        </div>
      </Panel>
      <Panel title="المفتاح">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <KeyRound className="size-5 text-ink-3" aria-hidden />
            {info?.hasActiveKey ? (
              <div className="leading-tight">
                <div dir="ltr" className="num text-ink">{info.apiKeyPrefix}…</div>
                {info.apiKeyCreatedAt && <div className="text-xs text-ink-3">أُنشئ في {formatDate(info.apiKeyCreatedAt)}</div>}
              </div>
            ) : (
              <span className="text-ink-2">لا يوجد مفتاح فعّال</span>
            )}
          </div>
          <Button onClick={rotate} loading={busy} variant={info?.hasActiveKey ? "secondary" : "primary"}>
            {info?.hasActiveKey ? "إنشاء مفتاح جديد" : "إنشاء مفتاح"}
          </Button>
          {newKey && <SecretReveal label="المفتاح الجديد" value={newKey} note="انسخ المفتاح الآن، فلن يظهر مرة أخرى." />}
        </div>
      </Panel>
    </div>
  );
}
