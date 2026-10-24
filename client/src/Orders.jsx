import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { exportOrders, getCompanies, updateOrder } from "./services/ordersApi";
import { usePagedOrders } from "./hooks/usePagedOrders";
import { getUser } from "./services/session";
import FormOrder from "./FormOrder";
import PrintLabel from "./PrintLabel";
import DeliverySelect from "./DeliverySelect";
import Pagination from "./Pagination";
import { OrdersHeader, OrderRow } from "./OrderRow";
import { printOrdersTable } from "./printOrders";
import { convertArabicNumbersToEnglish } from "./utils/numberUtils";
import { ORDER_STATUSES } from "./utils/orderStatus";

const PAGE_SIZE = 6;

function handlePrint(order) {
  const printRoot = document.createElement("div");
  document.body.appendChild(printRoot);
  ReactDOM.createRoot(printRoot).render(<PrintLabel order={order} />);
}

export default function Orders() {
  const user = getUser();
  const [companies, setCompanies] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // 🔍 Filters (changing one goes back to page 1)
  const [filters, setFilters] = useState({ search: "", company: "", status: "", delivery: "", date: "" });
  const setFilter = (name) => (value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  };
  const { search, company, status, delivery, date } = filters;

  const { loading, ...result } = usePagedOrders({ ...filters, page, limit: PAGE_SIZE }, reloadKey);

  useEffect(() => {
    getCompanies().then(setCompanies).catch(console.error);
  }, []);

  const handleUpdate = async (data) => {
    try {
      await updateOrder(editingOrder._id, data);
      setEditingOrder(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePrintTable = async () => {
    try {
      printOrdersTable(await exportOrders(filters));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="w-[98%] m-auto my-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="بحث برقم الهاتف أو الباركود"
          value={search}
          onChange={(e) => setFilter("search")(convertArabicNumbersToEnglish(e.target.value).replace(/\D/g, ""))}
          className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg"
        />

        <select value={status} onChange={(e) => setFilter("status")(e.target.value)} className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg">
          <option value="">اختر الحالة</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={company} onChange={(e) => setFilter("company")(e.target.value)} className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg">
          <option value="">اختر الشركة</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <DeliverySelect value={delivery} onChange={setFilter("delivery")} />

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
        <OrdersHeader lastColumn="الأمر" />
      </div>

      {/* Rows */}
      {loading ? (
        <p className="text-center my-4 text-xl">جاري التحميل...</p>
      ) : result.items.length > 0 ? (
        result.items.map((order, i) => (
          <div key={order._id} className="w-[98%] m-auto">
            <OrderRow
              order={order}
              index={(page - 1) * PAGE_SIZE + i + 1}
              actions={
                <>
                  {user?.role === "admin" && (
                    <button className="bg-orange-400 px-3 py-1 rounded cursor-pointer" onClick={() => setEditingOrder(order)}>
                      تعديل
                    </button>
                  )}
                  <button onClick={() => handlePrint(order)} className="bg-green-400 px-3 py-1 rounded cursor-pointer">
                    طباعة
                  </button>
                </>
              }
            />
          </div>
        ))
      ) : (
        <p className="text-center my-4">لا توجد أوردرات</p>
      )}

      <Pagination page={page} pages={result.pages} onChange={setPage} />

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-edit w-[90%] md:w-[600px] rounded-lg p-6 relative">
            <button className="absolute top-3 left-3 text-xl font-bold cursor-pointer" onClick={() => setEditingOrder(null)}>
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">تعديل الطلب</h2>
            <FormOrder initialData={editingOrder} onSubmit={handleUpdate} />
          </div>
        </div>
      )}
    </div>
  );
}
