import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";
import { getOrders } from "@/features/orders/api/orders-api";
import { OrdersHeader, OrderRow } from "@/features/orders/components/OrderRow";

const LATEST_COUNT = 3;

export default function DashboardLatestOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    getOrders({ limit: LATEST_COUNT })
      .then(({ data }) => setOrders(data))
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
