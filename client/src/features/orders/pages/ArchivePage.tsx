import { useCallback, useState } from "react";
import { Archive } from "lucide-react";
import { usePagedOrders } from "../hooks/use-paged-orders";
import { orderColumns } from "../components/order-columns";
import { OrderFilters } from "../components/OrderFilters";
import { EMPTY_FILTERS, type Filters } from "../lib/filters";
import OrderDetailsDrawer from "../components/OrderDetailsDrawer";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Money from "@/components/ui/Money";
import { FINAL_STATUSES } from "@/lib/order-status";

const PAGE_SIZE = 20;

export default function ArchivePage() {
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const setFilters = useCallback((f: Filters) => {
    setFiltersState(f);
    setPage(1);
  }, []);
  const { loading, items, total, pages, totalCost } = usePagedOrders({ archived: "true", ...filters, page, limit: PAGE_SIZE });

  return (
    <>
      <PageHeader title="الأرشيف" description="الشحنات المغلقة تُؤرشف تلقائيًا بعد المدة المحددة في الإعدادات." />
      <Panel bodyClassName="space-y-4">
        <OrderFilters value={filters} onChange={setFilters} statuses={FINAL_STATUSES} />
        {!loading && (
          <p className="text-sm text-ink-2">
            <span className="num">{total}</span> شحنة، إجمالي <b className="text-ink"><Money value={totalCost} /></b>
          </p>
        )}
        <DataTable
          caption="الأرشيف"
          columns={orderColumns()}
          rows={items}
          rowKey={(o) => o._id}
          loading={loading}
          onRowClick={(o) => setDetailsId(o._id)}
          empty={{ icon: <Archive />, title: "الأرشيف فارغ", description: "لا توجد شحنات مؤرشفة تطابق البحث." }}
        />
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Panel>
      <OrderDetailsDrawer orderId={detailsId} onClose={() => setDetailsId(null)} />
    </>
  );
}
