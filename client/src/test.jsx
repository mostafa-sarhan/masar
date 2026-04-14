import React, { useEffect, useState } from 'react';
import { getData, handleDelete, updateOrder } from './services/ordersApi';
import FormOrder from './FormOrder';
import Barcode from './Barcode';
import PrintLabel from './PrintLabel';
import ReactDOM from 'react-dom/client';
import { convertArabicNumbersToEnglish } from './utils/numberUtils';
import DeliverySelect from './DeliverySelect';

// ---------- Print a single order ----------
function handlePrint(order) {
  const printRoot = document.createElement('div');
  document.body.appendChild(printRoot);
  ReactDOM.createRoot(printRoot).render(<PrintLabel order={order} />);
}

// ---------- Print entire filtered table ----------
function handlePrintTable(filteredOrders) {
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
                <td>${order.createdAt}</td>
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

// ---------- Component ----------
export default function Orders() {
  const [order, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);

  // 🔍 Search states
  const [searchNumber, setSearchNumber] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchDelivery, setSearchDelivery] = useState("");
  const [searchDate, setSearchDate] = useState(""); // search by date

  // 📄 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ---------- Fetch data ----------
  useEffect(() => {
    getData(setOrders);
  }, []);

  // ---------- Get unique companies & deliveries ----------
  const companies = Array.from(new Set(order.map(o => o.company))).filter(Boolean);
  const deliveries = Array.from(new Set(order.map(o => o.delivery))).filter(Boolean);

  // ---------- Filter ----------
  const filteredOrders = order.filter(o => {
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
      !searchDate || o.createdAt?.startsWith(searchDate); // assuming createdAt is ISO string

    return matchNumber && matchCompany && matchStatus && matchDelivery && matchDate;
  });

  // ---------- Pagination ----------
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Reset page to 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchNumber, searchCompany, searchStatus, searchDelivery, searchDate]);

  // ---------- Total Cost (filtered) ----------
  const totalCost = filteredOrders.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  // ---------- Update ----------
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

  return (
    <div>
      {/* Search Inputs */}
      <div className=''>
        <input
          type="text"
          placeholder="بحث برقم الهاتف أو الباركود"
          value={searchNumber}
          onChange={(e) =>
            setSearchNumber(
              convertArabicNumbersToEnglish(e.target.value).replace(/\D/g, "")
            )
          }
          className="border w-[98%] rounded-lg p-3 text-lg"
        />
      </div>

      <div className="w-[98%] m-auto my-4 flex flex-wrap items-center gap-4">
        {/* البحث بالحالة */}
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

        {/* البحث بالشركة */}
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

        {/* البحث بالمندوب */}
        <DeliverySelect
          value={searchDelivery}
          onChange={setSearchDelivery}
          placeholder="اختر المندوب"
        />

        {/* البحث بالتاريخ */}
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="flex-1 min-w-[200px] border rounded-lg p-3 text-lg"
        />

        {/* زر الطباعة */}
        <button
          onClick={() => handlePrintTable(filteredOrders)}
          className="bg-green-500 text-white p-3 rounded-lg text-lg whitespace-nowrap cursor-pointer"
        >
          طباعة الجدول
        </button>
      </div>

      {/* باقي الكود زي ما هو ... الملخص، الجدول، الصفوف، Pagination، تعديل الطلب */}

                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center my-4">Not exist</p>
              )}
            </div>


            {/* Pagination Buttons */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 my-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 border rounded cursor-pointer"
                >
                  السابق
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded cursor-pointer ${currentPage === i + 1 ? "font-bold bg-gray-300" : ""}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 border rounded cursor-pointer"
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
    </div>
  );
}
