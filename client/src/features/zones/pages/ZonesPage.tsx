import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MapPinned, Pencil, Plus, Trash2 } from "lucide-react";
import { GOVERNORATES, getCity, getGovernorate, type ZoneInput } from "@masar/shared";
import { getZones, createZone, updateZone, deleteZone } from "@/lib/resources-api";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { Notice } from "@/components/ui/Feedback";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { PlacesMultiSelect } from "@/features/locations/components/PlaceSelects";
import { errorMessage } from "@/lib/errors";
import { toLatinDigits } from "@/lib/digits";
import { ApiError } from "@/lib/api-client";
import type { Zone } from "@/lib/types";

type Draft = { name: string; price: string; governorates: string[]; cities: string[] };
const EMPTY: Draft = { name: "", price: "", governorates: [], cities: [] };

const placesSummary = (z: Zone) =>
  [...z.governorates.map((g) => getGovernorate(g)?.ar ?? g), ...z.cities.map((c) => getCity(c)?.ar ?? c)].join("، ");

// Shipping zones: groups of governorates / cities with one price. A city in a zone beats its governorate's zone.
export default function ZonesPage() {
  const { toast, confirm } = useFeedback();
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [editing, setEditing] = useState<Zone | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [problems, setProblems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getZones().then(setZones).catch((err) => toast(errorMessage(err), "danger"));
  }, [reloadKey, toast]);

  // Governorates with no zone of their own (their orders get the flat company fee).
  const uncovered = useMemo(() => {
    if (!zones) return [];
    const covered = new Set(zones.flatMap((z) => z.governorates));
    return GOVERNORATES.filter((g) => !covered.has(g.code));
  }, [zones]);

  const open = (zone: Zone | "new") => {
    setEditing(zone);
    setProblems([]);
    setDraft(zone === "new" ? EMPTY : { name: zone.name, price: String(zone.price), governorates: zone.governorates, cities: zone.cities });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!draft.governorates.length && !draft.cities.length) return setProblems(["أضف محافظة أو مدينة واحدة على الأقل"]);
    const body: ZoneInput = { name: draft.name.trim(), price: Number(draft.price), governorates: draft.governorates, cities: draft.cities };
    try {
      setSaving(true);
      if (editing === "new") await createZone(body);
      else await updateZone(editing._id, body);
      toast(editing === "new" ? `تمت إضافة منطقة ${body.name}` : `تم حفظ منطقة ${body.name}`);
      setEditing(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      // Overlaps come back as one message per place ("مدينة نصر في منطقة القاهرة").
      if (err instanceof ApiError && err.code === "ZONE_OVERLAP" && Array.isArray(err.details)) setProblems((err.details as { message: string }[]).map((d) => d.message));
      else toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (zone: Zone) => {
    const ok = await confirm({
      title: `حذف منطقة ${zone.name}؟`,
      description: "الشحنات الحالية تحتفظ بسعرها. الشحنات الجديدة لهذه الأماكن ستأخذ عمولة الشركة الثابتة، وتُحذف أسعار التجار الخاصة بهذه المنطقة.",
      confirmLabel: "حذف المنطقة",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteZone(zone._id);
      toast(`تم حذف منطقة ${zone.name}`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast(errorMessage(err), "danger");
    }
  };

  return (
    <>
      <PageHeader
        title="مناطق الشحن"
        description="جمّع المحافظات أو المدن في مناطق بسعر شحن واحد. يُحسب السعر تلقائيًا عند إنشاء الشحنة، ويمكن تخصيص سعر لكل تاجر من صفحة التجار."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => open("new")}>منطقة جديدة</Button>}
      />
      {zones && zones.length > 0 && uncovered.length > 0 && (
        <Notice tone="info" className="mb-5">
          محافظات بلا منطقة ({uncovered.length}): {uncovered.map((g) => g.ar).join("، ")}. شحناتها تأخذ عمولة الشركة الثابتة من الإعدادات.
        </Notice>
      )}
      <Panel>
        <DataTable
          caption="مناطق الشحن"
          loading={!zones}
          rows={zones ?? []}
          rowKey={(z) => z._id}
          columns={[
            { key: "name", header: "المنطقة", primary: true, cell: (z) => <span className="font-medium text-ink">{z.name}</span> },
            { key: "price", header: "سعر الشحن", cell: (z) => <b className="text-ink"><Money value={z.price} /></b> },
            { key: "places", header: "تشمل", cell: (z) => <span className="line-clamp-2 max-w-md text-ink-2">{placesSummary(z)}</span> },
          ]}
          rowActions={(z) => (
            <div className="flex gap-1">
              <Button size="sm" variant="quiet" icon={<Pencil className="size-4" />} onClick={() => open(z)}>تعديل</Button>
              <Button size="sm" variant="quiet" className="text-stamp" icon={<Trash2 className="size-4" />} aria-label={`حذف ${z.name}`} onClick={() => remove(z)} />
            </div>
          )}
          empty={{
            icon: <MapPinned />,
            title: "لا توجد مناطق بعد",
            description: "بدون مناطق، تُحسب عمولة الشركة الثابتة على كل الشحنات.",
            action: <Button icon={<Plus className="size-4" />} onClick={() => open("new")}>أضف أول منطقة</Button>,
          }}
        />
      </Panel>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "منطقة جديدة" : `تعديل ${editing?.name ?? ""}`} className="max-w-xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <Field label="اسم المنطقة">{(p) => <Input {...p} required maxLength={60} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="مثال: القاهرة الكبرى" />}</Field>
            <Field label="سعر الشحن">
              {(p) => <Input {...p} required dir="ltr" inputMode="decimal" pattern="\d+(\.\d{1,2})?" value={draft.price} onChange={(e) => setDraft({ ...draft, price: toLatinDigits(e.target.value) })} />}
            </Field>
          </div>
          <Field label="محافظات كاملة" hint="كل مدن المحافظة، إلا المدن التي لها منطقة خاصة">
            {(p) => <PlacesMultiSelect {...p} kind="governorates" value={draft.governorates} onChange={(governorates) => setDraft({ ...draft, governorates })} placeholder="ابحث عن محافظة" />}
          </Field>
          <Field label="مدن بعينها" hint="تتقدم على منطقة محافظتها">
            {(p) => <PlacesMultiSelect {...p} kind="cities" value={draft.cities} onChange={(cities) => setDraft({ ...draft, cities })} placeholder="ابحث عن مدينة أو حي" />}
          </Field>
          {problems.length > 0 && (
            <Notice tone="danger">
              <ul className="list-inside list-disc space-y-0.5">
                {problems.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Notice>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button type="submit" loading={saving}>{editing === "new" ? "إضافة المنطقة" : "حفظ المنطقة"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
