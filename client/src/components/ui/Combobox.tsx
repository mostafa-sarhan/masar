import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { filterOptions, moveActive, toggleValue, type ComboOption } from "./combobox-logic";

export type { ComboOption } from "./combobox-logic";

interface BaseProps {
  // A fixed list, searched in the browser…
  options?: ComboOption[];
  // …or a server search for long lists (called as you type, debounced).
  loadOptions?(query: string): Promise<ComboOption[]>;
  // Labels for selected values that aren't in the loaded page (server-searched lists).
  resolveOptions?(values: string[]): Promise<ComboOption[]>;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  clearable?: boolean;
  required?: boolean;
  // Preferred side; the list flips by itself when there isn't room (e.g. the sticky bulk-actions bar).
  placement?: "bottom" | "top";
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}
// Single: `option` is the picked option (null when cleared), for callers that need its label.
type SingleProps = BaseProps & { multiple?: false; value: string; onChange(value: string, option: ComboOption | null): void };
type MultiProps = BaseProps & { multiple: true; value: string[]; onChange(value: string[]): void };

const MAX_VISIBLE = 100;

// Searchable select: type to filter (Arabic-aware), arrows + Enter to pick, Escape to close.
// One component for short fixed lists, long server-searched lists and multi-select.
export function Combobox(props: SingleProps | MultiProps) {
  const { options, loadOptions, resolveOptions, placeholder = "اختر", emptyText = "لا توجد نتائج", disabled, clearable = true, required, placement = "bottom", className } = props;
  const selected = useMemo(() => (props.multiple ? props.value : props.value ? [props.value] : []), [props.multiple, props.value]);

  const autoId = useId();
  const inputId = props.id ?? `${autoId}-input`;
  const listId = `${autoId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [remote, setRemote] = useState<{ query: string; options: ComboOption[] } | null>(null);
  const [known, setKnown] = useState<Map<string, ComboOption>>(() => new Map());

  // Remember every option we've seen, so chips and the closed field can show labels.
  const remember = (list: ComboOption[]) =>
    setKnown((prev) => {
      if (list.every((o) => prev.get(o.value)?.label === o.label)) return prev;
      const next = new Map(prev);
      for (const o of list) next.set(o.value, o);
      return next;
    });

  // Server search, debounced; the latest answer wins.
  useEffect(() => {
    if (!loadOptions || !open) return;
    let cancelled = false;
    const t = setTimeout(() => {
      loadOptions(query)
        .then((list) => {
          if (cancelled) return;
          remember(list);
          setRemote({ query, options: list });
        })
        .catch(() => !cancelled && setRemote({ query, options: [] }));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [loadOptions, open, query]);

  // Labels for selected values we haven't loaded yet.
  useEffect(() => {
    const missing = selected.filter((v) => !known.has(v) && !options?.some((o) => o.value === v));
    if (!missing.length || !resolveOptions) return;
    let cancelled = false;
    resolveOptions(missing).then((list) => !cancelled && remember(list)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selected, known, options, resolveOptions]);

  const loading = !!loadOptions && open && remote?.query !== query;
  const { visible, hidden } = useMemo(
    () => (loadOptions ? { visible: remote?.options ?? [], hidden: 0 } : filterOptions(options ?? [], query, MAX_VISIBLE)),
    [loadOptions, remote, options, query]
  );

  const labelOf = (value: string) => options?.find((o) => o.value === value)?.label ?? known.get(value)?.label ?? "";

  // Close on a click / tap outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // The list is `fixed` next to the field, so modals and scrolling panels never clip it.
  const [box, setBox] = useState<CSSProperties>({});
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom;
      const above = r.top;
      const up = placement === "top" ? above > 160 || above > below : below < 240 && above > below;
      const room = Math.max(120, (up ? above : below) - 12);
      setBox({
        position: "fixed",
        left: r.left,
        width: r.width,
        maxHeight: Math.min(288, room),
        ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, placement, selected.length]);

  // Keep the active option in view while moving with the keyboard.
  useEffect(() => {
    if (active >= 0) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function openList() {
    if (disabled) return;
    setOpen(true);
    setActive(-1);
  }
  function close() {
    setOpen(false);
    setQuery("");
    setActive(-1);
  }

  function pick(option: ComboOption) {
    remember([option]);
    if (props.multiple) {
      props.onChange(toggleValue(props.value, option.value));
      setQuery("");
      inputRef.current?.focus();
    } else {
      props.onChange(option.value, option);
      close();
    }
  }

  function clear() {
    if (props.multiple) props.onChange([]);
    else props.onChange("", null);
    setQuery("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) && (open || e.key === "ArrowDown")) {
      e.preventDefault();
      if (!open) return openList();
      setActive((i) => moveActive(i, e.key, visible.length));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      const option = visible[active] ?? (visible.length === 1 ? visible[0] : undefined);
      if (option) pick(option);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close();
    } else if (e.key === "Backspace" && props.multiple && !query && props.value.length) {
      props.onChange(props.value.slice(0, -1));
    }
  }

  const singleLabel = !props.multiple && props.value ? labelOf(props.value) : "";
  const showClear = clearable && selected.length > 0 && !disabled;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-rule bg-sheet ps-2 pe-16 text-sm transition-colors cursor-text",
          "focus-within:border-carbon focus-within:ring-2 focus-within:ring-carbon/20",
          props["aria-invalid"] && "border-stamp",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        onClick={() => {
          inputRef.current?.focus();
          if (!open) openList();
        }}
      >
        {props.multiple &&
          props.value.map((v) => (
            <span key={v} className="inline-flex max-w-full items-center gap-1 rounded bg-carbon-soft py-0.5 ps-2 pe-1 text-xs text-carbon">
              <span className="truncate">{labelOf(v) || "…"}</span>
              <button
                type="button"
                className="grid size-5 place-items-center rounded hover:bg-carbon/15 cursor-pointer"
                aria-label={`إزالة ${labelOf(v)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onChange(props.value.filter((x) => x !== v));
                }}
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          type="text"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          required={required && selected.length === 0}
          aria-label={props["aria-label"]}
          aria-invalid={props["aria-invalid"]}
          aria-describedby={props["aria-describedby"]}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          placeholder={props.multiple && props.value.length ? "" : singleLabel || placeholder}
          value={open ? query : singleLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            if (!open) setOpen(true);
          }}
          onFocus={() => !open && openList()}
          onKeyDown={onKeyDown}
          className={cn(
            "h-8 min-w-16 flex-1 bg-transparent px-1 text-base text-ink outline-none placeholder:text-ink-3 sm:text-sm",
            open && singleLabel && "placeholder:text-ink-2"
          )}
        />
      </div>
      <div className="pointer-events-none absolute inset-y-0 end-2 flex items-center gap-0.5">
        {showClear && (
          <button
            type="button"
            className="pointer-events-auto grid size-7 place-items-center rounded text-ink-3 hover:bg-sheet-2 hover:text-ink cursor-pointer"
            aria-label="مسح الاختيار"
            onClick={clear}
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
        <ChevronDown className={cn("size-4 text-ink-3 transition-transform", open && "rotate-180")} aria-hidden />
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-multiselectable={props.multiple || undefined}
          style={box}
          className="z-[70] overflow-y-auto overscroll-contain rounded-md border border-rule bg-sheet p-1 shadow-3"
        >
          {loading && visible.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-3 text-sm text-ink-3" role="presentation">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              جارٍ البحث…
            </li>
          ) : visible.length === 0 ? (
            <li className="px-3 py-3 text-sm text-ink-3" role="presentation">
              {emptyText}
            </li>
          ) : (
            visible.map((o, i) => {
              const isSelected = selected.includes(o.value);
              return (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onPointerDown={(e) => e.preventDefault()} // keep focus in the input
                  onClick={() => pick(o)}
                  onPointerMove={() => setActive(i)}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-sm sm:min-h-9",
                    i === active ? "bg-carbon-soft text-ink" : "text-ink",
                    isSelected && "font-medium"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.label}</span>
                    {o.hint && <span className="block truncate text-xs text-ink-3">{o.hint}</span>}
                  </span>
                  {isSelected && <Check className="size-4 shrink-0 text-carbon" aria-hidden />}
                </li>
              );
            })
          )}
          {hidden > 0 && (
            <li className="px-3 py-2 text-xs text-ink-3" role="presentation">
              و{hidden} خيارًا آخر. اكتب للبحث.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
