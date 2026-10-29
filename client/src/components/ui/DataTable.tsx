import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SkeletonRows, EmptyState } from "./Feedback";
import { Checkbox } from "./Field";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell(row: T): ReactNode;
  // Shown as the card title on mobile (one column should have it).
  primary?: boolean;
  // Hidden on mobile cards.
  hideOnMobile?: boolean;
  align?: "start" | "end";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey(row: T): string;
  loading?: boolean;
  empty?: { title: string; description?: ReactNode; icon?: ReactNode; action?: ReactNode };
  selection?: { selected: Set<string>; onToggle(id: string): void; onToggleAll(): void };
  onRowClick?(row: T): void;
  rowActions?(row: T): ReactNode;
  caption?: string;
}

// A table on wide screens and a stack of cards on phones, from the same column definitions.
export function DataTable<T>({ columns, rows, rowKey, loading, empty, selection, onRowClick, rowActions, caption }: DataTableProps<T>) {
  if (loading) return <SkeletonRows rows={6} className="py-2" />;
  if (!rows.length && empty) return <EmptyState {...empty} />;

  const allSelected = !!selection && rows.length > 0 && rows.every((r) => selection.selected.has(rowKey(r)));
  const primary = columns.find((c) => c.primary) ?? columns[0];

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-rule text-ink-2">
              {selection && (
                <th className="w-10 px-3 py-2.5 text-start">
                  <Checkbox checked={allSelected} onChange={selection.onToggleAll} aria-label="تحديد الكل" />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn("px-3 py-2.5 text-xs font-medium whitespace-nowrap", c.align === "end" ? "text-end" : "text-start", c.className)}>
                  {c.header}
                </th>
              ))}
              {rowActions && <th className="px-3 py-2.5" aria-label="إجراءات" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = rowKey(row);
              const selected = selection?.selected.has(id);
              return (
                <tr
                  key={id}
                  data-row
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("border-b border-rule-soft transition-colors", onRowClick && "cursor-pointer hover:bg-sheet-2", selected && "bg-carbon-soft/50")}
                >
                  {selection && (
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={!!selected} onChange={() => selection.onToggle(id)} aria-label="تحديد" />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-3 py-2.5 align-middle", c.align === "end" ? "text-end" : "text-start", c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-3 py-2 text-end whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {rows.map((row) => {
          const id = rowKey(row);
          const selected = selection?.selected.has(id);
          return (
            <li
              key={id}
              data-row
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("rounded-md border border-rule bg-sheet p-3", onRowClick && "cursor-pointer", selected && "border-carbon")}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="font-medium text-ink">{primary.cell(row)}</div>
                {selection && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={!!selected} onChange={() => selection.onToggle(id)} aria-label="تحديد" />
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {columns
                  .filter((c) => c !== primary && !c.hideOnMobile)
                  .map((c) => (
                    <div key={c.key} className="contents">
                      <dt className="text-ink-3">{c.header}</dt>
                      <dd className="text-ink">{c.cell(row)}</dd>
                    </div>
                  ))}
              </dl>
              {rowActions && (
                <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {rowActions(row)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
