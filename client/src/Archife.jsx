import React, { useEffect, useState } from "react";
import Barcode from "./Barcode";
import { formatDate } from "./utils/dataUtils";

export const ORDERS_URL = "https://sys-shipping-backend.onrender.com/orders";

// ==========================
// helper fetch with token
// ==========================
const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`حدث خطأ في السيرفر: ${res.status}`);
  return res.json();
};

export default function Archive() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Search states
  const [searchCompany, setSearchCompany] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    const fetchArchivedOrders = async () => {
      try {
        setLoading(true);
        const data = await fetchWithToken(ORDERS_URL);
        const archivedOrders = data.filter(order => order.isArchived);
        setOrders(archivedOrders);
      } catch (error) {
        console.error("فشل جلب الأوردرات المؤرشفة:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedOrders();
  }, []);

  // Companies for dropdown
  const companies = Array.from(new Set(orders.map(o => o.company))).filter(Boolean);

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchCompany = !searchCompany || o.company === searchCompany;
    const matchStatus = !searchStatus || o.status === searchStatus;
    const matchDate = !searchDate || o.createdAt.slice(0, 10) === searchDate;
    return matchCompany && matchStatus && matchDate;
  });

  // Summary
  const totalOrders = filteredOrders.length;
  const totalCost = filteredOrders.reduce((sum, order) => sum + (Number(order.cost) || 0), 0);

  return (
    <div className="w-[98%] m-auto my-4">
      <h2 className="text-2xl font-bold mb-4 text-center">الأرشيف</h2>

      {/* Search Inputs */}
      <div className="w-full flex gap-4 mb-4 flex-wrap">
        <select
          value={searchCompany}
          onChange={(e) => setSearchCompany(e.target.value)}
          className="border rounded p-2 w-[200px]"
        >
          <option value="">اختر الشركة</option>
          {companies.map((company, i) => (
            <option key={i} value={company}>{company}</option>
          ))}
        </select>

        <select
          value={searchStatus}
          onChange={(e) => setSearchStatus(e.target.value)}
          className="border rounded p-2 w-[200px]"
        >
          <option value="">اختر الحالة</option>
          <option value="تم التسليم">تم التسليم</option>
          <option value="مرتجع">مرتجع</option>
          <option value="مرفوض">مرفوض</option>
        </select>

        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="border rounded p-2 w-[200px]"
        />
      </div>

      {/* Summary */}
      <div className="w-full flex justify-around border rounded-lg p-2 mb-4 font-bold text-lg">
        <div>عدد الأوردرات: {totalOrders}</div>
        <div>الإجمالي: {totalCost} جنيه</div>
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
        <div className="orders-cell">ملاحظه</div>
      </div>

      {/* Table Rows */}
      <div className="my-2">
        {loading ? (
          <p className="text-center my-4 text-xl">جاري تحميل الأوردرات المؤرشفة...</p>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <div key={order._id || index} className="w-full m-auto">
              <div className="orders-grid border-x-2 border-t-2">
                <div className="orders-cell flex-col">
                  <span className="text-sm">{index + 1}</span>
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
                <div className="orders-cell">{order.status}</div>
                <div className="orders-cell">{order.company}</div>
                <div className="orders-cell">{order.delivery || "-"}</div>
                <div className="orders-cell font-bold">{order.cost}</div>
                <div className="orders-cell"></div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center my-4">لا توجد أوردرات مؤرشفة</p>
        )}
      </div>
    </div>
  );
}
