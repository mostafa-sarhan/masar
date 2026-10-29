import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { FeedbackContext, type ConfirmOptions, type ToastTone } from "./feedback-context";
import { Modal } from "./Overlay";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const ICONS = { ok: CheckCircle2, danger: AlertTriangle, info: Info };
const TONES = { ok: "border-ok/40", danger: "border-stamp/50", info: "border-rule" };

// Toasts (polite live region) and a promise-based confirm dialog, replacing alert()/confirm().
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve(v: boolean): void }) | null>(null);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: ToastTone = "ok") => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-3), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "danger" ? 7000 : 4000);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve })), []);
  const close = (value: boolean) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  const api = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div key={t.id} role={t.tone === "danger" ? "alert" : "status"} className={cn("pointer-events-auto flex max-w-md items-start gap-3 rounded-md border bg-sheet px-4 py-3 text-sm text-ink shadow-2", TONES[t.tone])}>
              <Icon className={cn("mt-0.5 size-4 shrink-0", t.tone === "ok" ? "text-ok" : t.tone === "danger" ? "text-stamp" : "text-carbon")} aria-hidden />
              <span className="whitespace-pre-line">{t.message}</span>
            </div>
          );
        })}
      </div>
      <Modal
        open={!!dialog}
        onClose={() => close(false)}
        title={dialog?.title ?? ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              إلغاء
            </Button>
            <Button variant={dialog?.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
              {dialog?.confirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">{dialog?.description}</p>
      </Modal>
    </FeedbackContext.Provider>
  );
}
