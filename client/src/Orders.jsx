import React, { useEffect, useState } from 'react';
import { getData, handleDelete, updateOrder } from './services/ordersApi';
import FormOrder from './FormOrder';
import Barcode from './Barcode';
import PrintLabel from './PrintLabel';
import ReactDOM from 'react-dom/client';
import DeliverySelect from './DeliverySelect';
import { convertArabicNumbersToEnglish } from './utils/numberUtils';
import { formatDate } from './utils/dataUtils';


const token = localStorage.getItem("token");

const URL = "https://sys-shipping-backend.onrender.com/orders";

// ---------- Print a single order ----------
function handlePrint(order) {
  const printRoot = document.createElement('div');
  document.body.appendChild(printRoot);
  ReactDOM.createRoot(printRoot).render(<PrintLabel order={order} />);
}

// ---------- Print entire filtered table ----------
function handlePrintTable(filteredOrders) {

    const formatDateForPrint = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // الشهور من 0
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

  const printWindow = window.open('', '', 'height=800,width=1000');

  const totalCost = filteredOrders.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

printWindow.document.write(`
  <html>
    <head>
      <title>طباعة الطلبات</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { text-align: center; margin-bottom: 10px; }
        .summary { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 8px; text-align: center; }
        th { background-color: #f0f0f0; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #e0e0e0; }

        /* زيادة عرض عمود التاريخ */
        th:first-child, td:first-child {
          min-width: 120px; /* أو 150px حسب المساحة المطلوبة */
        }
      </style>
    </head>
    <body>
      <h2>جدول الطلبات</h2>
      <div class="summary">عدد الأوردرات: ${filteredOrders.length} | الإجمالي: ${totalCost}</div>
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>الباركود</th>
            <th>العنوان</th>
            <th>المرسل إليه</th>
            <th>الشركة</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          ${filteredOrders.map(order => `
            <tr>
              <td>${formatDateForPrint(order.createdAt)}</td>
              <td>${order.barcode}</td>
              <td>${order.address}</td>
              <td>${order.fullName} - ${order.phone}</td>
              <td>${order.company}</td>
              <td>${order.cost}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
  </html>
`);


  printWindow.document.close();
  printWindow.print();
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);

  // 🔍 Search states
  const [searchNumber, setSearchNumber] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchDelivery, setSearchDelivery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [loading, setLoading] = useState(true);


  // 📄 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;


  // Fetch data
useEffect(() => {
  const fetchOrders = async () => {
    try {
      setLoading(true);
      await getData(setOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchOrders();
}, []);


  // Unique companies for dropdown
  const companies = Array.from(new Set(orders.map(o => o.company))).filter(Boolean);

  // Unique deliveries for dropdown
  const deliveries = Array.from(new Set(orders.map(o => o.delivery))).filter(Boolean);


    const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );



    // Filter orders
  const filteredOrders = sortedOrders.filter(o => {
    const matchNumber =
      !searchNumber ||
      o.phone?.includes(searchNumber) ||
      o.barcode?.includes(searchNumber);

    const matchCompany =
      !searchCompany || o.company === searchCompany;

    const matchStatus =
      !searchStatus || o.status === searchStatus;

    const matchDelivery =
      !searchDelivery || o.delivery === searchDelivery;

const matchDate =
  !searchDate || o.createdAt.slice(0, 10) === searchDate;



    return matchNumber && matchCompany && matchStatus && matchDelivery && matchDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchNumber, searchCompany, searchStatus, searchDelivery, searchDate]);

  // Total cost
  const totalCost = filteredOrders.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  // Update order
  const handleUpdate = async (data) => {
    try {
      await updateOrder(editingOrder._id, data);
      setOrders(prev =>
        prev.map(order =>
          order._id === editingOrder._id
            ? { ...order, ...data }
            : order
        )
      );
      setEditingOrder(null);
    } catch (err) {
      console.error(err);
    }
  };

  //roles

    const user = JSON.parse(localStorage.getItem("user"));


  if (loading) {
  return (
    <div className="w-full h-full flex justify-center items-center text-xl">
      جاري التحميل...
    </div>
  );
  }
  return (
    <div>
      {/* Search Inputs */}
      <div className="w-[98%] m-auto my-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="بحث برقم الهاتف أو الباركود"
          value={searchNumber}
          onChange={(e) =>
            setSearchNumber(
              convertArabicNumbersToEnglish(e.target.value).replace(/\D/g, "")
            )
          }
          className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg"
        />

        <select
          value={searchStatus}
          onChange={(e) => setSearchStatus(e.target.value)}
          className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg"
        >
          <option value="">اختر الحالة</option>
          <option value="قيد التنفيذ">قيد التنفيذ</option>
          <option value="مع المندوب">مع المندوب</option>
          <option value="تم التسليم">تم التسليم</option>
          <option value="مرتجع">مرتجع</option>
          <option value="مرفوض">مرفوض</option>
        </select>

        <select
          value={searchCompany}
          onChange={(e) => setSearchCompany(e.target.value)}
          className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg"
        >
          <option value="">اختر الشركة</option>
          {companies.map((company, i) => (
            <option key={i} value={company}>{company}</option>
          ))}
        </select>

        <DeliverySelect
          value={searchDelivery}
          onChange={setSearchDelivery}
        />

        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg"
        />

        <button
          onClick={() => handlePrintTable(filteredOrders)}
          className="bg-green-500 text-white p-3 rounded-lg text-lg whitespace-nowrap cursor-pointer"
        >
          طباعة الجدول
        </button>
      </div>

      {/* Summary */}
      <div className='w-[98%] m-auto my-3'>
        <div className="w-full m-auto grid grid-cols-12 border-2 my-4 rounded-lg">
          <div className="col-span-6 flex justify-center items-center gap-2 p-2 text-xl font-bold text-center">
            عدد الاوردارات: <p>{filteredOrders.length}</p>
          </div>
          <div className="col-span-6 flex justify-center items-center gap-2 p-2 text-xl font-bold text-center">
            الإجمالي: <p>{totalCost}</p>
          </div>
        </div>

        {/* Table Header */}
        <div className="orders-grid border-2 rounded-lg font-bold">
          <div className="orders-cell">العدد</div>
          <div className="orders-cell">التاريخ</div>
          <div className="orders-cell">الباركود</div>
          <div className="orders-cell">العنوان</div>
          <div className="orders-cell">المرسل إليه</div>
          <div className="orders-cell">الحالة</div>
          <div className="orders-cell">الشركة</div>
          <div className="orders-cell">المندوب</div>
          <div className="orders-cell">المبلغ</div>
          <div className="orders-cell">الأمر</div>
        </div>
      </div>

      {/* Orders Rows */}
      <div className="">
        {paginatedOrders.length > 0 ? (
          paginatedOrders.map((order, index) => (
            <div key={index} className="w-[98%] m-auto">
              <div className="orders-grid border-x-2 border-t-2">

                <div className="orders-cell flex-col">
                    <span className="text-sm">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </span>
                </div>
                <div className="orders-cell flex-col">
                  <span className="text-sm">{formatDate(order.createdAt)}</span>
                </div>


                <div className="orders-cell">
                  <Barcode value={order.barcode} />
                </div>

                <div className="orders-cell">{order.address}</div>

                <div className="orders-cell flex-col">
                  <span>{order.fullName}</span>
                  <span className="text-sm">{order.phone}</span>
                </div>

                <div className="orders-cell font-semibold">{order.status}</div>

                <div className="orders-cell">{order.company}</div>

                <div className="orders-cell">{order.delivery || "-"}</div>

                <div className="orders-cell font-bold">{order.cost}</div>

                <div className="orders-cell gap-2">
                  {user?.role === "admin" && (
                    <>
                    <button
                    className="bg-orange-400 px-3 py-1 rounded cursor-pointer"
                    onClick={() => setEditingOrder(order)}
                  >
                    تعديل
                  </button>
                    </>
                  )}

                  <button
                    onClick={() => handlePrint(order)}
                    className="bg-green-400 px-3 py-1 rounded cursor-pointer"
                  >
                    طباعة
                  </button>
                </div>

              </div>
            </div>
          ))
        ) : (
          <p className="text-center my-4">لا توجد أوردرات</p>
        )}
      </div>

{/* Pagination */}
{totalPages > 1 && (
  <div className="flex justify-center items-center gap-2 my-6">

    {/* السابق */}
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(p => p - 1)}
      className={`px-4 py-2 rounded border
        ${currentPage === 1
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-200 cursor-pointer"}
      `}
    >
      السابق
    </button>

    {/* أرقام الصفحات (حد أقصى 5) */}
    {(() => {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + 4);

      // علشان نضمن دايمًا 5 أرقام لو ينفع
      if (end - start < 4) {
        start = Math.max(1, end - 4);
      }

      return Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      ).map(page => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`px-3 py-2 rounded border cursor-pointer
            ${currentPage === page
              ? "bg-gray-400 text-white font-bold"
              : "hover:bg-gray-200"}
          `}
        >
          {page}
        </button>
      ));
    })()}

    {/* التالي */}
    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(p => p + 1)}
      className={`px-4 py-2 rounded border
        ${currentPage === totalPages
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-200 cursor-pointer"}
      `}
    >
      التالي
    </button>

  </div>
)}


      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-edit w-[90%] md:w-[600px] rounded-lg p-6 relative">
            <button
              className="absolute top-3 left-3 text-xl font-bold cursor-pointer"
              onClick={() => setEditingOrder(null)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">تعديل الطلب</h2>
            <FormOrder
              initialData={editingOrder}
              onSubmit={handleUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
