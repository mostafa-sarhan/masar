import { useEffect, useState, type FormEvent } from "react";
import { Bike, Plus, UserPlus } from "lucide-react";
import { getCouriers, createCourier } from "@/lib/resources-api";
import { createCourierAccount } from "@/lib/portals-api";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { Badge } from "@/components/ui/Status";
import { AccountForm } from "@/components/forms/AccountForm";
import { useFeedback } from "@/components/ui/feedback-context";
import { errorMessage } from "@/lib/errors";
import type { Courier } from "@/lib/types";

// Courier records and their logins for the courier app. Results and commissions: Reports > Couriers.
export default function CouriersPage() {
  const { toast } = useFeedback();
  const [couriers, setCouriers] = useState<Courier[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [accountFor, setAccountFor] = useState<Courier | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getCouriers().then(setCouriers).catch((err) => toast(errorMessage(err), "danger"));
  }, [reloadKey, toast]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createCourier(name.trim());
      toast(`تمت إضافة المندوب ${name.trim()}`);
      setName("");
      setAdding(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="المناديب"
        description="أضف المناديب وأنشئ لكل منهم حسابًا لتطبيق المندوب على الهاتف."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            مندوب جديد
          </Button>
        }
      />
      <Panel>
        <DataTable
          caption="المناديب"
          loading={!couriers}
          rows={couriers ?? []}
          rowKey={(c) => c._id}
          columns={[
            { key: "name", header: "المندوب", primary: true, cell: (c) => <span className="font-medium text-ink">{c.name}</span> },
            {
              key: "account",
              header: "حساب التطبيق",
              cell: (c) => (c.account ? <span dir="ltr" className="text-ink-2">{c.account}</span> : <Badge>بدون حساب</Badge>),
            },
          ]}
          rowActions={(c) =>
            !c.account && (
              <Button variant="secondary" size="sm" icon={<UserPlus className="size-4" />} onClick={() => setAccountFor(c)}>
                إنشاء حساب
              </Button>
            )
          }
          empty={{ icon: <Bike />, title: "لا يوجد مناديب بعد", description: "أضف أول مندوب لتبدأ في تسليم الشحنات.", action: <Button onClick={() => setAdding(true)}>مندوب جديد</Button> }}
        />
      </Panel>

      <Modal open={adding} onClose={() => setAdding(false)} title="مندوب جديد">
        <form onSubmit={add} className="space-y-4">
          <Field label="اسم المندوب">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoFocus />}</Field>
          <Button type="submit" loading={saving} className="w-full">
            إضافة
          </Button>
        </form>
      </Modal>

      <Modal open={!!accountFor} onClose={() => setAccountFor(null)} title={`حساب تطبيق المندوب: ${accountFor?.name ?? ""}`} description="يرى المندوب شحناته فقط ويسجّل نتيجة كل تسليم.">
        {accountFor && (
          <AccountForm
            onSubmit={async (email, password) => {
              await createCourierAccount(accountFor._id, email, password);
              toast(`تم إنشاء حساب ${email}`);
              setAccountFor(null);
              setReloadKey((k) => k + 1);
            }}
          />
        )}
      </Modal>
    </>
  );
}
