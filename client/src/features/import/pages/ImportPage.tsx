import { useRef, useState } from "react";
import { FileSpreadsheet, Download, Upload, CheckCircle2 } from "lucide-react";
import { importOrders, downloadImportTemplate } from "@/features/orders/api/orders-api";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Feedback";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { ApiError } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import type { ImportCheck } from "@/lib/types";

const FIELDS: Record<string, string> = { fullName: "الاسم", phone: "الهاتف", address: "العنوان", cost: "المبلغ", merchant: "التاجر", description: "ملاحظات", reference: "المرجع" };
const STEPS = ["حمّل النموذج واملأه، أو استخدم ملفك بنفس أسماء الأعمدة", "اختر الملف وافحصه: تظهر كل الأخطاء برقم الصف", "استورد عندما يخلو الملف من الأخطاء: إما كل الصفوف أو لا شيء"];

// Upload .xlsx -> check (errors per row) -> import (all or nothing).
export default function ImportPage() {
  const { toast } = useFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [check, setCheck] = useState<ImportCheck | null>(null);
  const [busy, setBusy] = useState<"check" | "import" | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = async (mode: "dry-run" | "commit") => {
    if (!file) return;
    try {
      setBusy(mode === "commit" ? "import" : "check");
      if (mode === "dry-run") {
        setCheck(await importOrders(file, "dry-run"));
      } else {
        const res = await importOrders(file, "commit");
        setDone(res.created ?? 0);
        toast(`تم استيراد ${res.created} شحنة`);
        setFile(null);
        setCheck(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "IMPORT_INVALID") setCheck({ ...(err.details as ImportCheck), validRows: 0 });
      toast(errorMessage(err), "danger");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="استيراد شحنات من Excel"
        description="ملف ‎.xlsx‎ واحد، حتى 2 ميجابايت و1000 صف."
        actions={<Button variant="secondary" icon={<Download className="size-4" />} onClick={() => downloadImportTemplate().catch((err) => toast(errorMessage(err), "danger"))}>تحميل النموذج</Button>}
      />
      <ol className="mb-5 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s} className="flex gap-3 rounded-lg border border-rule bg-sheet p-4 text-sm text-ink-2">
            <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-carbon-soft font-semibold text-carbon">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <Panel bodyClassName="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-rule bg-sheet-2 px-6 py-10 text-center transition-colors hover:border-carbon">
          <FileSpreadsheet className="size-8 text-ink-3" aria-hidden />
          <span className="font-medium text-ink">{file ? file.name : "اختر ملف Excel"}</span>
          <span className="text-xs text-ink-3">{file ? `${(file.size / 1024).toFixed(0)} كيلوبايت` : "أو اسحبه إلى هنا"}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setCheck(null);
              setDone(null);
            }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<CheckCircle2 className="size-4" />} disabled={!file} loading={busy === "check"} onClick={() => run("dry-run")}>
            فحص الملف
          </Button>
          <Button icon={<Upload className="size-4" />} disabled={!check || check.errors.length > 0} loading={busy === "import"} onClick={() => run("commit")}>
            {check && !check.errors.length ? `استيراد ${check.totalRows} شحنة` : "استيراد"}
          </Button>
        </div>

        {done !== null && <Notice tone="ok">تم استيراد {done} شحنة. تجدها في صفحة الشحنات.</Notice>}
        {check && (
          <div className="space-y-4">
            <Notice tone={check.errors.length ? "danger" : "ok"}>
              {check.errors.length ? `${check.totalRows} صف، منها ${check.validRows} صالحة و${new Set(check.errors.map((e) => e.row)).size} بها أخطاء. صحّح الملف ثم افحصه مجددًا.` : `الملف سليم: ${check.totalRows} صف جاهز للاستيراد.`}
            </Notice>
            {check.errors.length > 0 && (
              <DataTable
                caption="أخطاء الملف"
                rows={check.errors}
                rowKey={(e) => `${e.row}-${e.field}`}
                columns={[
                  { key: "row", header: "الصف", primary: true, cell: (e) => <span className="num font-medium">{e.row}</span> },
                  { key: "field", header: "العمود", cell: (e) => FIELDS[e.field] ?? e.field },
                  { key: "msg", header: "المشكلة", cell: (e) => <span dir="auto" className="text-stamp">{e.message}</span> },
                ]}
              />
            )}
            {!!check.preview?.length && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink">معاينة أول الصفوف</h3>
                <DataTable
                  caption="معاينة"
                  rows={check.preview}
                  rowKey={(r) => String(r.row)}
                  columns={[
                    { key: "row", header: "الصف", cell: (r) => <span className="num">{r.row}</span> },
                    { key: "name", header: "الاسم", primary: true, cell: (r) => r.fullName },
                    { key: "phone", header: "الهاتف", cell: (r) => <span dir="ltr" className="num">{r.phone}</span> },
                    { key: "address", header: "العنوان", cell: (r) => r.address },
                    { key: "cost", header: "المبلغ", align: "end", cell: (r) => <Money value={r.cost} /> },
                    { key: "merchant", header: "التاجر", cell: (r) => r.merchant },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
