// Previous / next plus up to 5 page numbers around the current page.
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  let start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const navClass = (disabled) =>
    `px-4 py-2 rounded border ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200 cursor-pointer"}`;

  return (
    <div className="flex justify-center items-center gap-2 my-6">
      <button disabled={page === 1} onClick={() => onChange(page - 1)} className={navClass(page === 1)}>
        السابق
      </button>

      {numbers.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-3 py-2 rounded border cursor-pointer ${
            page === n ? "bg-gray-400 text-white font-bold" : "hover:bg-gray-200"
          }`}
        >
          {n}
        </button>
      ))}

      <button disabled={page === pages} onClick={() => onChange(page + 1)} className={navClass(page === pages)}>
        التالي
      </button>
    </div>
  );
}
