import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PackagePlus, Printer, Package } from "lucide-react";
import type { OrderUpdate } from "@masar/shared";
import { exportOrders, updateOrder } from "../api/orders-api";
import { usePagedOrders } from "../hooks/use-paged-orders";
import { orderColumns } from "../components/order-columns";
import { OrderFilters, type Filters } from "../components/OrderFilters";
import OrderDetailsDrawer from "../components/OrderDetailsDrawer";
import BulkActions from "../components/BulkActions";
import OrderForm from "../components/OrderForm";
import { printLabel, printOrdersTable } from "../lib/print";
import { useAuth } from "@/app/auth-context";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import Pagination from "@/components/ui/Pagination";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { ORDER_STATUSES } from "@/lib/order-status";
import { isAdmin as isAdminRole } from "@/lib/roles";
import { errorMessage } from "@/lib/errors";
import type { Order } from "@/lib/types";

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const { user } = useAuth();
  const admin = isAdminRole(user?.role);
  const { toast } = useFeedback();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);

  // Filters live in the URL, so a search from the command palette or a shared link works.
  const filters: Filters = {
    search: params.get("search") ?? "",
    status: params.get("status") ?? "",
    merchant: params.get("merchant") ?? "",
    courier: params.get("courier") ?? "",
    date: params.get("date") ?? "",
  };
  const setFilters = useCallback(
    (f: Filters) => {
      setParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v)), { replace: true });
      setPage(1);
      setSelected(new Set());
    },
    [setParams]
  );

  const { loading, items, total, pages, totalCost } = usePagedOrders({ ...filters, page, limit: PAGE_SIZE }, reloadKey);
  const selectedOrders = useMemo(() => items.filter((o) => selected.has(o._id)), [items, selected]);
  const reload = () => setReloadKey((k) => k + 1);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected((s) => (items.every((o) => s.has(o._id)) ? new Set() : new Set(items.map((o) => o._id))));

  // Owners/admins print everything matching the filters; employees print the current page.
  const printTable = async () => {
    try {
      if (!admin) return printOrdersTable(items);
      const { data, meta } = await exportOrders(filters);
      if (meta.truncated) toast(`ستُطبع أول ${data.length} شحنة من ${meta.total}`, "info");
      printOrdersTable(data);
    } catch (err) {
      toast(errorMessage(err), "danger");
    }
  };

  const saveEdit = async (changes: OrderUpdate) => {
    if (!editing) return;
    try {
      if (Object.keys(changes).length) await updateOrder(editing._id, changes);
      setEditing(null);
      toast("تم حفظ التعديلات");
      reload();
    } catch (err) {
      toast(errorMessage(err), "danger");
    }
  };

  return (
    <>
      <PageHeader
        title="الشحنات"
        actions={
          <>
            <Button variant="secondary" icon={<Printer className="size-4" />} onClick={printTable}>
              طباعة الجدول
            </Button>
            <Link to="/orders/new">
              <Button icon={<PackagePlus className="size-4" />}>شحنة جديدة</Button>
            </Link>
          </>
        }
      />
      {!loading && (
        <p className="-mt-4 mb-4 text-sm text-ink-2">
          <span className="num">{total}</span> شحنة مفتوحة، إجمالي التحصيل <b className="text-ink"><Money value={totalCost} /></b>
        </p>
      )}
      <Panel bodyClassName="space-y-4">
        <OrderFilters value={filters} onChange={setFilters} statuses={ORDER_STATUSES} />
        <DataTable
          caption="الشحنات"
          columns={orderColumns()}
          rows={items}
          rowKey={(o) => o._id}
          loading={loading}
          onRowClick={(o) => setDetailsId(o._id)}
          selection={{ selected, onToggle: toggle, onToggleAll: toggleAll }}
          rowActions={(o) => (
            <Button variant="quiet" size="sm" icon={<Printer className="size-4" />} onClick={() => printLabel(o)} aria-label={`طباعة ملصق ${o.barcode}`} title="طباعة الملصق" />
          )}
          empty={{
            icon: <Package />,
            title: Object.values(filters).some(Boolean) ? "لا توجد شحنات تطابق البحث" : "لا توجد شحنات مفتوحة",
            description: Object.values(filters).some(Boolean) ? "جرّب تغيير الفلاتر أو مسحها." : "أضف شحنة جديدة أو استورد ملف Excel.",
            action: Object.values(filters).some(Boolean) ? (
              <Button variant="secondary" onClick={() => setFilters({ search: "", status: "", merchant: "", courier: "", date: "" })}>
                مسح الفلاتر
              </Button>
            ) : (
              <Link to="/orders/new"><Button>شحنة جديدة</Button></Link>
            ),
          }}
        />
        <Pagination page={page} pages={pages} onChange={(p) => { setPage(p); setSelected(new Set()); }} />
      </Panel>

      {selectedOrders.length > 0 && <BulkActions selected={selectedOrders} onClear={() => setSelected(new Set())} onDone={() => { setSelected(new Set()); reload(); }} />}

      <OrderDetailsDrawer orderId={detailsId} onClose={() => setDetailsId(null)} onEdit={admin ? (o) => { setDetailsId(null); setEditing(o); } : undefined} />
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `تعديل الشحنة ${editing.barcode}` : ""} className="w-[min(40rem,calc(100vw-2rem))]">
        {editing && <OrderForm initialData={editing} onSubmit={saveEdit} role={user?.role} />}
      </Modal>
    </>
  );
}
