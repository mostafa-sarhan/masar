import { useState } from "react";
import { HandCoins, Bike } from "lucide-react";
import type { OrderStatus } from "@masar/shared";
import { getOrders, bulkStatus } from "../api/orders-api";
import { orderColumns } from "../components/order-columns";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import { getSettlement } from "@/lib/resources-api";
import { useAuth } from "@/app/auth-context";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Feedback";
import { StatusBadge } from "@/components/ui/Status";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { errorMessage } from "@/lib/errors";
import { nextStatuses, statusLabel } from "@/lib/order-status";
import { isAdmin as isAdminRole } from "@/lib/roles";
import type { Order, Courier, Summary, ReportMeta } from "@/lib/types";

const MAX_ORDERS = 100;
type BatchOrder = Order & { outcome?: OrderStatus };

// End of the courier's day: set each order's result, save them together, see what the courier hands over.
export default function CourierBatchPage() {
  const { user } = useAuth();
  const admin = isAdminRole(user?.role);
  const { toast, confirm } = useFeedback();
  const [courier, setCourier] = useState("");
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [orders, setOrders] = useState<BatchOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courierFee, setCourierFee] = useState("");
  const [settlement, setSettlement] = useState<(Summary & { fees: ReportMeta["fees"] }) | null>(null);
  const courierName = couriers.find((c) => c._id === courier)?.name;

  const loadSettlement = async (list: BatchOrder[], fee = courierFee) => {
    if (!list.length) return setSettlement(null);
    const { data, meta } = await getSettlement(list.map((o) => o._id), admin && fee !== "" ? { courierFee: Number(fee) } : {});
    setSettlement({ ...data, fees: meta.fees });
  };

  const selectCourier = async (id: string) => {
    setCourier(id);
    setOrders([]);
    setSettlement(null);
    if (!id) return;
    try {
      setLoading(true);
      const { data, meta } = await getOrders({ courier: id, status: "with_courier", limit: MAX_ORDERS });
      setOrders(data);
      setTotal(meta.total);
      await loadSettlement(data);
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setLoading(false);
    }
  };

  // Untouched rows count as delivered, the courier's usual outcome.
  const save = async () => {
    const updates = orders.filter((o) => o.status === "with_courier").map((o) => ({ id: o._id, status: o.outcome ?? ("delivered" as OrderStatus) })).filter((u) => u.status !== "with_courier");
    if (!updates.length) return;
    const delivered = updates.filter((u) => u.status === "delivered").length;
    if (!(await confirm({ title: `حفظ نتائج ${updates.length} شحنة؟`, description: `${delivered} تم التسليم، ${updates.length - delivered} نتائج أخرى. لن يُحفظ شيء إذا تعذّر حفظ أي شحنة.`, confirmLabel: "حفظ النتائج" }))) return;
    try {
      setSaving(true);
      await bulkStatus(updates);
      const byId = new Map(updates.map((u) => [u.id, u.status]));
      const saved: BatchOrder[] = orders.map((o) => (byId.has(o._id) ? { ...o, status: byId.get(o._id)!, outcome: undefined } : o));
      setOrders(saved);
      await loadSettlement(saved);
      toast("تم حفظ نتائج المندوب");
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };

  const money = settlement?.money;
  const open = orders.filter((o) => o.status === "with_courier").length;

  return (
    <>
      <PageHeader title="تسوية المناديب" description="اختر المندوب، حدد نتيجة كل شحنة، واحفظها دفعة واحدة." />
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Panel
          title={courierName ? `شحنات ${courierName}` : "شحنات المندوب"}
          action={<CourierSelect value={courier} onChange={selectCourier} onLoaded={setCouriers} placeholder="اختر المندوب" className="h-9 w-48" aria-label="المندوب" />}
          bodyClassName="space-y-3"
        >
          {total > MAX_ORDERS && <Notice tone="warn">تُعرض أول {MAX_ORDERS} شحنة من {total}.</Notice>}
          <DataTable
            caption="شحنات المندوب"
            loading={loading}
            columns={[
              ...orderColumns<BatchOrder>(["barcode", "customer", "address", "cost"]),
              {
                key: "outcome",
                header: "النتيجة",
                cell: (o) =>
                  o.status === "with_courier" ? (
                    <Select
                      value={o.outcome ?? "delivered"}
                      onChange={(e) => setOrders((list) => list.map((x) => (x._id === o._id ? { ...x, outcome: e.target.value as OrderStatus } : x)))}
                      className="h-9 w-36"
                      aria-label={`نتيجة ${o.barcode}`}
                    >
                      {["with_courier" as OrderStatus, ...nextStatuses("with_courier", user?.role)].map((s) => (
                        <option key={s} value={s}>
                          {s === "with_courier" ? "لم تُحسم بعد" : statusLabel(s)}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <StatusBadge status={o.status} pressed />
                  ),
              },
            ]}
            rows={orders}
            rowKey={(o) => o._id}
            empty={{ icon: <Bike />, title: courier ? "لا شحنات مع هذا المندوب" : "اختر مندوبًا", description: courier ? "كل شحناته محسومة." : "تظهر هنا الشحنات التي معه الآن." }}
          />
          {open > 0 && (
            <div className="flex justify-end">
              <Button icon={<HandCoins className="size-4" />} loading={saving} onClick={save}>
                حفظ النتائج ({open})
              </Button>
            </div>
          )}
        </Panel>

        <Panel title="التسوية" bodyClassName="space-y-3">
          {admin && (
            <Field label="عمولة المندوب لكل شحنة" hint="اتركها فارغة لاستخدام العمولة المحفوظة">
              {(p) => <Input {...p} type="number" min={0} dir="ltr" placeholder={String(settlement?.fees.courier ?? "")} value={courierFee} onChange={(e) => setCourierFee(e.target.value)} onBlur={() => loadSettlement(orders).catch((err) => toast(errorMessage(err), "danger"))} />}
            </Field>
          )}
          {settlement && money ? (
            <dl className="divide-y divide-rule-soft text-sm">
              {[
                ["عدد الشحنات", <span className="num">{settlement.total.count}</span>],
                ["إجمالي التحصيل", <Money value={settlement.total.amount} />],
                ["تم تسليمه", <Money value={money.deliveredTotal} />],
                ["غير مسلّم", <Money value={settlement.total.amount - money.deliveredTotal} />],
                ["عمولة المندوب", <Money value={money.courierCommission} />],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between py-2">
                  <dt className="text-ink-2">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between py-3">
                <dt className="font-semibold text-ink">يسلّمه المندوب للخزنة</dt>
                <dd className="text-lg font-semibold text-ink"><Money value={money.afterCourier} /></dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-ink-3">اختر مندوبًا لعرض التسوية.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
