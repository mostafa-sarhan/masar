import { useEffect, useState } from "react";
import StatesCard from "@/features/dashboard/components/StatCard";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DashboardLatestOrders from "@/features/dashboard/components/LatestOrders";
import { getOrderStats } from "@/features/orders/api/orders-api";
import { statusLabel } from "@/lib/order-status";

export default function Dashboard() {
  const [stats, setStats] = useState({
    delivered: 0,
    inProgress: 0,
    returned: 0,
    refused: 0,
    withDelivery: 0,
  });

  useEffect(() => {
    getOrderStats()
      .then((counts) =>
        setStats({
          delivered: counts.delivered || 0,
          inProgress: counts.pending || 0,
          returned: counts.returned || 0,
          refused: counts.refused || 0,
          withDelivery: counts.with_courier || 0,
        })
      )
      .catch((error) => console.error("Error fetching stats:", error));
  }, []);

  /* ===== Chart Data ===== */
  const chartData = [
    { name: statusLabel("delivered"), value: stats.delivered },
    { name: statusLabel("pending"), value: stats.inProgress },
    { name: statusLabel("returned"), value: stats.returned },
    { name: statusLabel("refused"), value: stats.refused },
    { name: statusLabel("with_courier"), value: stats.withDelivery },
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
          <StatesCard title={statusLabel("delivered")} value={stats.delivered} color="green" />
          <StatesCard title={statusLabel("pending")} value={stats.inProgress} color="blue" />
          <StatesCard title={statusLabel("returned")} value={stats.returned} color="yellow" />
          <StatesCard title={statusLabel("refused")} value={stats.refused} color="red" />
        </div>

        <StatesCard
          title={statusLabel("with_courier")}
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
