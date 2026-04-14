import React, { useEffect, useState } from "react";
import Barcode from "../Barcode";
import { formatDate } from "../utils/dataUtils";
// import { getData } from "../services/ordersApi";
import ReactDOM from "react-dom/client";
import PrintLabel from "../PrintLabel";
import { getData } from "../services/ordersApi";


// طباعة أوردر واحد
function handlePrint(order) {
  const printRoot = document.createElement("div");
  document.body.appendChild(printRoot);
  ReactDOM.createRoot(printRoot).render(<PrintLabel order={order} />);
}

export default function DashboardLatestOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getData(setOrders);
  }, []);

  // آخر 5 أوردرات
  const latestOrders = orders.slice(-3).reverse();

  return (
    <div className=" bg-main rounded-lg">
      <h2 className="text-xl text-start font-bold mb-1 text-white">آخر الطلبات</h2>

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

      {/* Orders Rows */}
      {latestOrders.map((order, index) => (
        <div key={index} className="orders-grid border-x-2 border-t-2">
          <div className="orders-cell">{index+1}</div>
          <div className="orders-cell">{formatDate(order.createdAt)}</div>
          <div className="orders-cell"><Barcode value={order.barcode} /></div>
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
          </div>
        </div>
      ))}
    </div>
  );
}
