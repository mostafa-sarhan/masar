import { Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Feedback";
import { useFeedback } from "@/components/ui/feedback-context";

// A secret shown exactly once (API key, one-time password), with a copy button.
export function SecretReveal({ label, value, note }: { label: string; value: string; note: string }) {
  const { toast } = useFeedback();
  return (
    <div className="space-y-3">
      <Notice tone="warn">{note}</Notice>
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
        <div className="flex gap-2">
          <code dir="ltr" className="flex-1 select-all break-all rounded-md border border-rule bg-sheet-2 px-3 py-2 text-sm text-ink">
            {value}
          </code>
          <Button variant="secondary" icon={<Copy className="size-4" />} onClick={() => navigator.clipboard?.writeText(value).then(() => toast("تم النسخ"))}>
            نسخ
          </Button>
        </div>
      </div>
    </div>
  );
}
