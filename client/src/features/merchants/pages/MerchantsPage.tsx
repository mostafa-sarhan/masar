import { useEffect, useState, type FormEvent } from "react";
import { Store, Plus, KeyRound, UserPlus, Percent, Ban } from "lucide-react";
import { getMerchants, createMerchant, rotateMerchantKey, revokeMerchantKey, updateMerchant, getZones, setMerchantZonePrices } from "@/lib/resources-api";
import { createMerchantUser } from "@/lib/portals-api";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { Badge } from "@/components/ui/Status";
import { AccountForm } from "@/components/forms/AccountForm";
import { SecretReveal } from "@/components/forms/SecretReveal";
import { useFeedback } from "@/components/ui/feedback-context";
import Money from "@/components/ui/Money";
import { errorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format-date";
import type { Merchant, Zone } from "@/lib/types";
import { Skeleton } from "@/components/ui/Feedback";
import { toLatinDigits } from "@/lib/digits";

type Dialog = { kind: "add" } | { kind: "key"; name: string; apiKey: string } | { kind: "fee"; merchant: Merchant } | { kind: "user"; merchant: Merchant } | null;

// Merchants (the shipping company's clients): API keys, company-fee overrides and portal users.
export default function MerchantsPage() {
  const { toast, confirm } = useFeedback();
  const [merchants, setMerchants] = useState<Merchant[] | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    getMerchants().then(setMerchants).catch((err) => toast(errorMessage(err), "danger"));
  }, [reloadKey, toast]);

  const rotate = async (m: Merchant) => {
    if (m.hasActiveKey && !(await confirm({ title: `تغيير مفتاح ${m.name}؟`, description: "سيتوقف المفتاح الحالي فورًا، ويجب تحديثه في نظام التاجر.", confirmLabel: "تغيير المفتاح", danger: true }))) return;
    try {
      const { apiKey } = await rotateMerchantKey(m._id);
      setDialog({ kind: "key", name: m.name, apiKey });
      reload();
    } catch (err) {
      toast(errorMessage(err), "danger");
    }
  };

  const revoke = async (m: Merchant) => {
    if (!(await confirm({ title: `إلغاء مفتاح ${m.name}؟`, description: "لن يتمكن نظام التاجر من إرسال شحنات حتى يُنشأ مفتاح جديد.", confirmLabel: "إلغاء المفتاح", danger: true }))) return;
    try {
      await revokeMerchantKey(m._id);
      toast("تم إلغاء المفتاح");
      reload();
    } catch (err) {
      toast(errorMessage(err), "danger");
    }
  };

  return (
    <>
      <PageHeader
        title="التجار"
        description="مفاتيح الربط مع أنظمة التجار، وعمولة الشركة الخاصة بكل تاجر، وحسابات بوابة التاجر."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setDialog({ kind: "add" })}>تاجر جديد</Button>}
      />
      <Panel>
        <DataTable
          caption="التجار"
          loading={!merchants}
          rows={merchants ?? []}
          rowKey={(m) => m._id}
          columns={[
            { key: "name", header: "التاجر", primary: true, cell: (m) => <span className="font-medium text-ink">{m.name}</span> },
            {
              key: "key",
              header: "مفتاح الربط",
              cell: (m) => (m.hasActiveKey ? <span dir="ltr" className="num text-ink-2">{m.apiKeyPrefix}…</span> : m.apiKeyRevokedAt ? <Badge tone="danger">ملغى</Badge> : <Badge>لا يوجد</Badge>),
            },
            {
              key: "fee",
              header: "الأسعار",
              cell: (m) => (
                <span className="text-ink-2">
                  {m.companyFee === null && !m.zonePrices?.length ? <span className="text-ink-3">الافتراضية</span> : <>{m.zonePrices?.length ? `${m.zonePrices.length} منطقة بسعر خاص` : <Money value={m.companyFee ?? 0} />}</>}
                </span>
              ),
            },
            { key: "users", header: "حسابات البوابة", cell: (m) => (m.users?.length ? <span dir="ltr" className="text-ink-2">{m.users.join("، ")}</span> : <span className="text-ink-3">—</span>) },
            { key: "created", header: "أُضيف", hideOnMobile: true, cell: (m) => <span className="num text-ink-3">{formatDate(m.createdAt)}</span> },
          ]}
          rowActions={(m) => (
            <div className="flex flex-wrap gap-1">
              <Button variant="quiet" size="sm" icon={<KeyRound className="size-4" />} onClick={() => rotate(m)}>
                {m.hasActiveKey ? "تغيير المفتاح" : "إنشاء مفتاح"}
              </Button>
              {m.hasActiveKey && <Button variant="quiet" size="sm" icon={<Ban className="size-4" />} onClick={() => revoke(m)} aria-label={`إلغاء مفتاح ${m.name}`} title="إلغاء المفتاح" />}
              <Button variant="quiet" size="sm" icon={<Percent className="size-4" />} onClick={() => setDialog({ kind: "fee", merchant: m })} aria-label="الأسعار" title="الأسعار" />
              <Button variant="quiet" size="sm" icon={<UserPlus className="size-4" />} onClick={() => setDialog({ kind: "user", merchant: m })} aria-label="حساب بوابة" title="إضافة حساب بوابة" />
            </div>
          )}
          empty={{ icon: <Store />, title: "لا يوجد تجار بعد", description: "أضف أول تاجر لتسجيل شحناته.", action: <Button onClick={() => setDialog({ kind: "add" })}>تاجر جديد</Button> }}
        />
      </Panel>

      <AddMerchant open={dialog?.kind === "add"} onClose={() => setDialog(null)} onCreated={(name, apiKey) => { reload(); setDialog(apiKey ? { kind: "key", name, apiKey } : null); }} />

      <Modal open={dialog?.kind === "key"} onClose={() => setDialog(null)} title={dialog?.kind === "key" ? `مفتاح الربط: ${dialog.name}` : ""}>
        {dialog?.kind === "key" && <SecretReveal label="مفتاح API" value={dialog.apiKey} note="انسخ المفتاح الآن. لن يظهر مرة أخرى، ولا نحتفظ إلا بنسخة مشفّرة منه." />}
      </Modal>

      {dialog?.kind === "fee" && <FeeDialog merchant={dialog.merchant} onClose={() => setDialog(null)} onSaved={reload} />}

      <Modal open={dialog?.kind === "user"} onClose={() => setDialog(null)} title={dialog?.kind === "user" ? `حساب بوابة: ${dialog.merchant.name}` : ""} description="يرى التاجر شحناته وكشف حسابه فقط.">
        {dialog?.kind === "user" && (
          <AccountForm
            onSubmit={async (email, password) => {
              await createMerchantUser(dialog.merchant._id, email, password);
              toast(`تم إنشاء حساب ${email}`);
              setDialog(null);
              reload();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function AddMerchant({ open, onClose, onCreated }: { open: boolean; onClose(): void; onCreated(name: string, apiKey: string | null): void }) {
  const { toast } = useFeedback();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { merchant, apiKey } = await createMerchant(name.trim());
      toast(`تمت إضافة ${merchant.name}`);
      setName("");
      onCreated(merchant.name, apiKey);
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="تاجر جديد" description="يُنشأ له مفتاح ربط تلقائيًا ويظهر لك مرة واحدة.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="اسم التاجر">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoFocus />}</Field>
        <Button type="submit" loading={saving} className="w-full">
          إضافة التاجر
        </Button>
      </form>
    </Modal>
  );
}

// The merchant's prices: a flat company fee (orders outside every zone) and its own price per zone.
// Empty fields fall back to the defaults (settings / the zone's price).
function FeeDialog({ merchant, onClose, onSaved }: { merchant: Merchant; onClose(): void; onSaved(): void }) {
  const { toast } = useFeedback();
  const [fee, setFee] = useState(merchant.companyFee === null ? "" : String(merchant.companyFee));
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>(() => Object.fromEntries((merchant.zonePrices ?? []).map((p) => [p.zone, String(p.price)])));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getZones().then(setZones).catch(() => setZones([]));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateMerchant(merchant._id, { companyFee: fee.trim() === "" ? null : Number(fee) });
      const zonePrices = Object.entries(prices)
        .filter(([zone, price]) => price.trim() !== "" && zones?.some((z) => z._id === zone))
        .map(([zone, price]) => ({ zone, price: Number(price) }));
      await setMerchantZonePrices(merchant._id, zonePrices);
      toast(`تم حفظ أسعار ${merchant.name}`);
      onSaved();
      onClose();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={`أسعار ${merchant.name}`} description="تُطبَّق على الشحنات الجديدة فقط. اترك الحقل فارغًا لاستخدام السعر الافتراضي.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-ink">سعر الشحن حسب المنطقة</p>
          {!zones ? (
            <Skeleton className="h-24" />
          ) : zones.length === 0 ? (
            <p className="text-sm text-ink-3">لا توجد مناطق شحن بعد. أضفها من صفحة مناطق الشحن.</p>
          ) : (
            <ul className="divide-y divide-rule-soft rounded-md border border-rule">
              {zones.map((z) => (
                <li key={z._id} className="flex items-center gap-3 px-3 py-2">
                  <label htmlFor={`zp-${z._id}`} className="min-w-0 flex-1 truncate text-sm text-ink">
                    {z.name}
                  </label>
                  <Input
                    id={`zp-${z._id}`}
                    dir="ltr"
                    inputMode="decimal"
                    pattern="\d+(\.\d{1,2})?"
                    className="h-9 w-28"
                    placeholder={String(z.price)}
                    value={prices[z._id] ?? ""}
                    onChange={(e) => setPrices({ ...prices, [z._id]: toLatinDigits(e.target.value) })}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <Field label="عمولة الشركة خارج المناطق" hint="لكل شحنة مسلّمة لا تقع في أي منطقة">
          {(p) => <Input {...p} dir="ltr" inputMode="decimal" pattern="\d+(\.\d{1,2})?" value={fee} onChange={(e) => setFee(toLatinDigits(e.target.value))} placeholder="الافتراضية" />}
        </Field>
        <Button type="submit" loading={saving} className="w-full">
          حفظ الأسعار
        </Button>
      </form>
    </Modal>
  );
}
