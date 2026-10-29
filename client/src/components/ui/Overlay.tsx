import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

interface OverlayProps {
  open: boolean;
  onClose(): void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

// Native <dialog>: focus trap, Escape and inert background for free.
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const cancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", cancel);
    return () => d.removeEventListener("cancel", cancel);
  }, [onClose]);
  // Click on the backdrop (outside the panel) closes.
  const onClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose();
  };
  return { ref, onClick };
}

function Head({ title, description, onClose }: Pick<OverlayProps, "title" | "description" | "onClose">) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-rule-soft px-5 py-4">
      <div>
        <h2 className="text-md font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
      </div>
      <Button variant="quiet" size="sm" onClick={onClose} icon={<X className="size-4" />} aria-label="إغلاق" />
    </header>
  );
}

export function Modal({ open, onClose, title, description, children, footer, className }: OverlayProps) {
  const { ref, onClick } = useDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      onClick={onClick}
      className={cn("m-auto w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-lg border border-rule bg-sheet p-0 text-ink shadow-3 backdrop:backdrop-blur-[2px]", className)}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <Head title={title} description={description} onClose={onClose} />
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-rule-soft bg-sheet-2 px-5 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

// Side panel from the inline-start edge (right in Arabic).
export function Drawer({ open, onClose, title, description, children, footer, className }: OverlayProps) {
  const { ref, onClick } = useDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      onClick={onClick}
      className={cn("m-0 ms-auto h-dvh max-h-dvh w-[min(30rem,100vw)] max-w-none overflow-hidden border-s border-rule bg-sheet p-0 text-ink shadow-3", className)}
    >
      {open && (
        <div className="flex h-full flex-col">
          <Head title={title} description={description} onClose={onClose} />
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-rule-soft bg-sheet-2 px-5 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
