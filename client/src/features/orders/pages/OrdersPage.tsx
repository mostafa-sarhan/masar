import { useState } from "react";
import type { OrderUpdate } from "@masar/shared";
import type { Order } from "@/lib/types";
import { exportOrders, updateOrder } from "@/features/orders/api/orders-api";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "@/app/auth-context";
import { isAdmin as isAdminRole } from "@/lib/roles";
import { usePagedOrders } from "@/features/orders/hooks/use-paged-orders";
import OrderForm from "@/features/orders/components/OrderForm";
import OrderDetails from "@/features/orders/components/OrderDetailsDrawer";
import BulkActions from "@/features/orders/components/BulkActions";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";
import Pagination from "@/components/ui/Pagination";
import { OrdersHeader, OrderRow } from "@/features/orders/components/OrderRow";
import { printLabel, printOrdersTable } from "@/features/orders/lib/print";
import { toLatinDigits } from "@/lib/digits";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";

const PAGE_SIZE = 6;

export default function OrdersPage() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  // Selected orders on the current page (cleared when the page or filters change).
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // 🔍 Filters (changing one goes back to page 1)
  const [filters, setFilters] = useState({ search: "", merchant: "", status: "", courier: "", date: "" });
  const setFilter = (name: keyof typeof filters) => (value: string) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
    setSelected({});
  };
  const goToPage = (p: number) => {
    setPage(p);
    setSelected({});
  };
  const { search, merchant, status, courier, date } = filters;

  const { loading, ...result } = usePagedOrders({ ...filters, page, limit: PAGE_SIZE }, reloadKey);
  const selectedOrders = result.items.filter((o) => selected[o._id]);
  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const allSelected = result.items.length > 0 && selectedOrders.length === result.items.length;
  const toggleAll = () => setSelected(allSelected ? {} : Object.fromEntries(result.items.map((o) => [o._id, true])));

  const handleUpdate = async (changes: OrderUpdate) => {
    try {
      if (editingOrder && Object.keys(changes).length) await updateOrder(editingOrder._id, changes);
      setEditingOrder(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  // Admins print everything that matches the filters; employees print the current page.
  const handlePrintTable = async () => {
    try {
      if (!isAdmin) return printOrdersTable(result.items);
      const { data, meta } = await exportOrders(filters);
      if (meta?.truncated) alert(`سيتم طباعة أول ${data.length} من ${meta?.total} أوردر`);
      printOrdersTable(data);
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="w-[98%] m-auto my-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="بحث برقم الهاتف أو الباركود (من البداية)"
          value={search}
          onChange={(e) => setFilter("search")(toLatinDigits(e.target.value).replace(/\D/g, ""))}
          className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg"
        />

        <select value={status} onChange={(e) => setFilter("status")(e.target.value)} className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg">
          <option value="">اختر الحالة</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>

        <MerchantSelect value={merchant} onChange={setFilter("merchant")} className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg" />

        <CourierSelect value={courier} onChange={setFilter("courier")} />

        <input type="date" value={date} onChange={(e) => setFilter("date")(e.target.value)} className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg" />

        <button onClick={handlePrintTable} className="bg-green-500 text-white p-3 rounded-lg text-lg whitespace-nowrap cursor-pointer">
          طباعة الجدول
        </button>
      </div>

      {/* Summary */}
      <div className="w-[98%] m-auto my-3">
        <div className="w-full m-auto grid grid-cols-12 border-2 my-4 rounded-lg">
          <div className="col-span-6 flex justify-center items-center gap-2 p-2 text-xl font-bold text-center">
            عدد الاوردارات: <p>{result.total}</p>
          </div>
          <div className="col-span-6 flex justify-center items-center gap-2 p-2 text-xl font-bold text-center">
            الإجمالي: <p>{result.totalCost}</p>
          </div>
        </div>
        <OrdersHeader lastColumn="الأمر" selection={{ all: allSelected, onToggleAll: toggleAll }} />
      </div>

      {selectedOrders.length > 0 && (
        <BulkActions
          selected={selectedOrders}
          onClear={() => setSelected({})}
          onDone={() => {
            setSelected({});
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {/* Rows */}
      {loading ? (
        <p className="text-center my-4 text-xl">جاري التحميل...</p>
      ) : result.items.length > 0 ? (
        result.items.map((order, i) => (
          <div key={order._id} className="w-[98%] m-auto">
            <OrderRow
              order={order}
              index={(page - 1) * PAGE_SIZE + i + 1}
              selected={!!selected[order._id]}
              onToggle={() => toggle(order._id)}
              actions={
                <>
                  {isAdmin && (
                    <button className="bg-orange-400 px-3 py-1 rounded cursor-pointer" onClick={() => setEditingOrder(order)}>
                      تعديل
                    </button>
                  )}
                  <button onClick={() => printLabel(order)} className="bg-green-400 px-3 py-1 rounded cursor-pointer">
                    طباعة
                  </button>
                  <button onClick={() => setDetailsId(order._id)} className="bg-blue-400 px-3 py-1 rounded cursor-pointer">
                    تفاصيل
                  </button>
                </>
              }
            />
          </div>
        ))
      ) : (
        <p className="text-center my-4">لا توجد أوردرات</p>
      )}

      <Pagination page={page} pages={result.pages} onChange={goToPage} />

      {detailsId && <OrderDetails orderId={detailsId} onClose={() => setDetailsId(null)} />}

      {/* Edit Modal (admin) */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-edit w-[90%] md:w-[600px] rounded-lg p-6 relative">
            <button className="absolute top-3 left-3 text-xl font-bold cursor-pointer" onClick={() => setEditingOrder(null)}>
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">تعديل الطلب</h2>
            <OrderForm initialData={editingOrder} onSubmit={handleUpdate} role={user?.role} />
          </div>
        </div>
      )}
    </div>
  );
}
