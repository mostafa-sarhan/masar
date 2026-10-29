import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

// Previous / next plus up to 5 page numbers. In RTL, "previous" points right.
export default function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange(page: number): void }) {
  if (pages <= 1) return null;
  let start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="mt-4 flex items-center justify-center gap-1" aria-label="الصفحات">
      <Button variant="quiet" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)} icon={<ChevronRight className="size-4" />} aria-label="الصفحة السابقة" />
      {numbers.map((n) => (
        <Button key={n} variant={n === page ? "secondary" : "quiet"} size="sm" onClick={() => onChange(n)} aria-current={n === page ? "page" : undefined} className="num min-w-8">
          {n}
        </Button>
      ))}
      <Button variant="quiet" size="sm" disabled={page === pages} onClick={() => onChange(page + 1)} icon={<ChevronLeft className="size-4" />} aria-label="الصفحة التالية" />
    </nav>
  );
}
