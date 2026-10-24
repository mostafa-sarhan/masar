import React, { useEffect, useState } from "react";
import { exportOrders } from "./services/ordersApi";
import { getDeliveries, createDelivery } from "./services/resourcesApi";

export default function ReportDelivery() {
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newDeliveryName, setNewDeliveryName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, deliveriesData] = await Promise.all([
          exportOrders({ archived: "all" }),
          getDeliveries(),
        ]);

        setOrders(ordersData);
        setDeliveries(deliveriesData.map(d => d.name));
      } catch (error) {
        console.error("فشل جلب البيانات:", error);
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // إضافة مندوب جديد
  const handleAddDelivery = async () => {
    if (!newDeliveryName.trim()) {
      alert("من فضلك أدخل اسم المندوب");
      return;
    }

    try {
      const data = await createDelivery(newDeliveryName);

      setDeliveries(prev => [...prev, data.name || newDeliveryName]);
      setNewDeliveryName("");
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("فشل إضافة المندوب: " + error.message);
    }
  };

  // تجهيز التقرير
  const report = deliveries
    .filter(d => !selectedDelivery || d === selectedDelivery)
    .map(delivery => {
      const deliveryOrders = orders.filter(o => o.delivery === delivery);

      const summary = {
        name: delivery,
        تم_التسليم: 0,
        مرتجع: 0,
        مرفوض: 0,
        قيد_التنفيذ: 0,
        مع_المندوب: 0,
        المبلغ: 0,
      };

      deliveryOrders.forEach(order => {
        const statusKey = order.status.replace(/ /g, "_");
        if (summary[statusKey] !== undefined) summary[statusKey] += 1;
      });

      summary.المبلغ = summary.تم_التسليم * 20; // عمولة ثابتة لكل تسليم
      return summary;
    });

  return (
    <div className="w-[98%] m-auto my-4">
      <h2 className="text-2xl font-bold mb-4 text-center">تقارير المناديب</h2>

      {/* فلتر + زر إضافة مندوب */}
      <div className="mb-4 flex gap-4 items-center">
        <select
          value={selectedDelivery}
          onChange={(e) => setSelectedDelivery(e.target.value)}
          className="border-2 rounded-lg px-3 py-2 max-w-full"
        >
          <option value="">-- اختر المندوب --</option>
          {deliveries.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
        >
          + إضافة مندوب
        </button>
      </div>

      {loading ? (
        <p className="text-center">جاري التحميل...</p>
      ) : report.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 text-center">
            <thead>
              <tr>
                <th className="border p-2">المندوب</th>
                <th className="border p-2">تم التسليم</th>
                <th className="border p-2">مرتجع</th>
                <th className="border p-2">مرفوض</th>
                <th className="border p-2">قيد التنفيذ</th>
                <th className="border p-2">مع المندوب</th>
                <th className="border p-2">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, i) => (
                <tr key={i}>
                  <td className="border p-2">{r.name}</td>
                  <td className="border p-2">{r.تم_التسليم}</td>
                  <td className="border p-2">{r.مرتجع}</td>
                  <td className="border p-2">{r.مرفوض}</td>
                  <td className="border p-2">{r.قيد_التنفيذ}</td>
                  <td className="border p-2">{r.مع_المندوب}</td>
                  <td className="border p-2 font-bold">{r.المبلغ}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center">لا توجد بيانات</p>
      )}

      {/* Modal إضافة مندوب */}
      {showModal && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
          <div className=" w-[400px] bg-main rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-right">إضافة مندوب جديد</h2>
            <input
              type="text"
              placeholder="اسم المندوب"
              value={newDeliveryName}
              onChange={(e) => setNewDeliveryName(e.target.value)}
              className="border-2 rounded w-full px-3 py-2 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddDelivery}
                className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
