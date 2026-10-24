import React, { useEffect, useState } from "react";
import { getOrders } from "../services/ordersApi";
import { OrdersHeader, OrderRow } from "../OrderRow";

const LATEST_COUNT = 3;

export default function DashboardLatestOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getOrders({ limit: LATEST_COUNT })
      .then((data) => setOrders(data.items))
      .catch(console.error);
  }, []);

  return (
    <div className="bg-main rounded-lg">
      <h2 className="text-xl text-start font-bold mb-1 text-white">آخر الطلبات</h2>
      <OrdersHeader />
      {orders.map((order, i) => (
        <OrderRow key={order._id} order={order} index={i + 1} />
      ))}
    </div>
  );
}
