import React, { useEffect, useState } from "react";
import StatesCard from "./StatesCard";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DashboardLatestOrders from "./DashboardLatestOrders";

export const ORDERS_URL = "https://sys-shipping-backend.onrender.com/orders";

// helper function for fetch with token
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
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    delivered: 0,
    inProgress: 0,
    returned: 0,
    refused: 0,
    withDelivery: 0,
  });

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchWithToken(ORDERS_URL);

        setStats({
          delivered: data.filter((o) => o.status === "تم التسليم").length,
          inProgress: data.filter((o) => o.status === "قيد التنفيذ").length,
          returned: data.filter((o) => o.status === "مرتجع").length,
          refused: data.filter((o) => o.status === "مرفوض").length,
          withDelivery: data.filter((o) => o.status === "مع المندوب").length,
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    getData();
  }, []);

  /* ===== Chart Data ===== */
  const chartData = [
    { name: "تم التسليم", value: stats.delivered },
    { name: "قيد التنفيذ", value: stats.inProgress },
    { name: "مرتجع", value: stats.returned },
    { name: "مرفوض", value: stats.refused },
    { name: "مع المندوب", value: stats.withDelivery },
  ];

  const COLORS = ["#22c55e", "#3b82f6", "#facc15", "#ef4444", "#8b5cf6"];

  return (
    <div className="grid grid-cols-12 gap-4 w-full p-4">
      {/* ===== Right Side : Stats ===== */}
      <div className="col-span-12 lg:col-span-5 space-y-4">
        <h2 className="bg-gray-100 text-xl font-bold text-black rounded-lg p-2">
          ملخص الشحنات
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <StatesCard title="تم التسليم" value={stats.delivered} color="green" />
          <StatesCard title="قيد التنفيذ" value={stats.inProgress} color="blue" />
          <StatesCard title="مرتجع" value={stats.returned} color="yellow" />
          <StatesCard title="مرفوض" value={stats.refused} color="red" />
        </div>

        <StatesCard
          title="مع المندوب"
          value={stats.withDelivery}
          color="purple"
          full
        />
      </div>

      {/* ===== Left Side : Chart ===== */}
      <div className="col-span-12 lg:col-span-7 bg-gray-100 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4 text-black text-center">
          إحصائيات الشحنات
        </h2>

        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              label
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              iconSize={14}
              formatter={(value) => (
                <span style={{ marginInlineStart: 6 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ===== Latest Orders ===== */}
      <div className="col-span-12">
        <DashboardLatestOrders />
      </div>
    </div>
  );
}
