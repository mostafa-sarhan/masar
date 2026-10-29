import Money from "@/components/ui/Money";
import { useState } from "react";
import { usePagedOrders } from "@/features/orders/hooks/use-paged-orders";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";
import Pagination from "@/components/ui/Pagination";
import { OrdersHeader, OrderRow } from "@/features/orders/components/OrderRow";
import { FINAL_STATUSES, statusLabel } from "@/lib/order-status";

const PAGE_SIZE = 20;

export default function Archive() {
  const [page, setPage] = useState(1);

  // 🔍 Filters (changing one goes back to page 1)
  const [filters, setFilters] = useState({ merchant: "", status: "", date: "" });
  const setFilter = (name: keyof typeof filters) => (value: string) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  };
  const { merchant, status, date } = filters;

  const { loading, ...result } = usePagedOrders({ archived: "true", ...filters, page, limit: PAGE_SIZE });

  return (
    <div className="w-[98%] m-auto my-4">
      <h2 className="text-2xl font-bold mb-4 text-center">الأرشيف</h2>

      {/* Filters */}
      <div className="w-full flex gap-4 mb-4 flex-wrap">
        <MerchantSelect value={merchant} onChange={setFilter("merchant")} className="border rounded p-2 w-[200px]" />

        <select value={status} onChange={(e) => setFilter("status")(e.target.value)} className="border rounded p-2 w-[200px]">
          <option value="">اختر الحالة</option>
          {FINAL_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>

        <input type="date" value={date} onChange={(e) => setFilter("date")(e.target.value)} className="border rounded p-2 w-[200px]" />
      </div>

      {/* Summary */}
      <div className="w-full flex justify-around border rounded-lg p-2 mb-4 font-bold text-lg">
        <div>عدد الأوردرات: {result.total}</div>
        <div>الإجمالي: <Money value={result.totalCost} /></div>
      </div>

      <OrdersHeader />

      <div className="my-2">
        {loading ? (
          <p className="text-center my-4 text-xl">جاري تحميل الأوردرات المؤرشفة...</p>
        ) : result.items.length > 0 ? (
          result.items.map((order, i) => <OrderRow key={order._id} order={order} index={(page - 1) * PAGE_SIZE + i + 1} />)
        ) : (
          <p className="text-center my-4">لا توجد أوردرات مؤرشفة</p>
        )}
      </div>

      <Pagination page={page} pages={result.pages} onChange={setPage} />
    </div>
  );
}
