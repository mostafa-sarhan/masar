import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft } from "lucide-react";
import { NAV_GROUPS } from "@/app/navigation";
import { toLatinDigits } from "@/lib/digits";
import { cn } from "@/lib/cn";

interface Item {
  id: string;
  label: string;
  hint?: string;
  run(): void;
}

// Ctrl/⌘ + K: jump to a page, or search orders by phone or barcode.
export function CommandPalette({ open, onClose, isAdmin }: { open: boolean; onClose(): void; isAdmin: boolean }) {
  const navigate = useNavigate();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setQuery("");
      setActive(0);
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const q = toLatinDigits(query.trim());
    const go = (to: string) => () => {
      navigate(to);
      onClose();
    };
    const pages = NAV_GROUPS.flatMap((g) => g.items)
      .filter((i) => !i.adminOnly || isAdmin)
      .filter((i) => !q || `${i.label} ${i.keywords ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      .map((i) => ({ id: i.to, label: i.label, hint: "صفحة", run: go(i.to) }));
    const search = /^[\d+A-Za-z-]{3,}$/.test(q) ? [{ id: "search", label: `البحث عن شحنة: ${q}`, hint: "هاتف أو باركود", run: go(`/orders?search=${encodeURIComponent(q.replace(/\s/g, ""))}`) }] : [];
    return [...search, ...pages];
  }, [query, isAdmin, navigate, onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[active]?.run();
    }
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="mx-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-rule bg-sheet p-0 text-ink shadow-3"
      aria-label="بحث سريع"
    >
      {open && (
        <div onKeyDown={onKeyDown}>
          <div className="flex items-center gap-3 border-b border-rule-soft px-4">
            <Search className="size-4 text-ink-3" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder="اكتب اسم صفحة، أو رقم هاتف أو باركود شحنة"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
              role="combobox"
              aria-expanded
              aria-controls="command-results"
              aria-activedescendant={items[active] ? `cmd-${items[active].id}` : undefined}
            />
            <kbd className="rounded border border-rule px-1.5 text-2xs text-ink-3">Esc</kbd>
          </div>
          <ul id="command-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
            {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-3">لا توجد نتائج</li>}
            {items.map((item, i) => (
              <li
                key={item.id}
                id={`cmd-${item.id}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={item.run}
                className={cn("flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-sm", i === active ? "bg-carbon-soft text-carbon" : "text-ink")}
              >
                <span>{item.label}</span>
                <span className="flex items-center gap-1.5 text-2xs text-ink-3">
                  {item.hint}
                  {i === active && <CornerDownLeft className="size-3" aria-hidden />}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </dialog>
  );
}
