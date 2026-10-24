import React, { useEffect, useState } from "react";
import { exportOrders } from "./services/ordersApi";
import { getDeliveries } from "./services/resourcesApi";
import { downloadReport } from "./utils/excel";

export default function Account() {
  const [deliveryFee, setDeliveryFee] = useState(20); // قيمة افتراضية
  const [companyFree, setCompanyFree] = useState(20); // قيمة افتراضية
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const getOrders = async () => {
      try {
        const [dataOrders, dataDeliveries] = await Promise.all([
          exportOrders({ archived: "all" }),
          getDeliveries(),
        ]);
        setOrders(dataOrders || []);
        setDeliveries(dataDeliveries || []);
      } catch (err) {
        console.error("فشل جلب البيانات:", err);
      }
    };
    getOrders();
  }, []);

  // ===== فلترة الأوردرات حسب المندوب، الحالة، الشركة والتاريخ =====
  // تاريخ النهاية شامل اليوم كله
  const filteredOrders = orders.filter((order) => {
    const day = order.createdAt?.slice(0, 10);
    const afterStart = startDate ? day >= startDate : true;
    const beforeEnd = endDate ? day <= endDate : true;
    const courierMatch = selectedCourier ? order.delivery === selectedCourier : true;
    const statusMatch = selectedStatus ? order.status === selectedStatus : true;
    const companyMatch = selectedCompany ? order.company === selectedCompany : true;
    return afterStart && beforeEnd && courierMatch && statusMatch && companyMatch;
  });

  // ===== ملخص لجميع الحالات =====
  const getCount = (status) => filteredOrders.filter((o) => o.status === status).length;
const summary = {
  "تم التسليم": getCount("تم التسليم"),
  "مرتجع": getCount("مرتجع"),
  "مرفوض": getCount("مرفوض"),
  "قيد التنفيذ": getCount("قيد التنفيذ"),
  "استبدال": getCount("استبدال"),
  "مع المندوب": getCount("مع المندوب"),
};

  const totalAmount = filteredOrders.reduce((acc, o) => acc + Number(o.cost || 0), 0);
  const deliveredOrders = filteredOrders.filter((o) => o.status === "تم التسليم");
  const deliveredTotal = deliveredOrders.reduce((acc, o) => acc + Number(o.cost || 0), 0);
  const totalCommission = deliveredOrders.length * deliveryFee;
  const remainingAmount = deliveredTotal - totalCommission;
  const companyGain = deliveredOrders.length * companyFree;
  const merchantMoney = remainingAmount - companyGain;

  // ===== حفظ كشف الحساب Excel =====
  const saveReport = () =>
    downloadReport({
      fileName: `كشف_الحساب_${selectedCourier || "جميع"}`,
      sheetName: "كشف الحساب",
      summary: [
        ["تاريخ البداية:", startDate, "", "", "", "الإجمالي الكلي:", totalAmount],
        ["تاريخ النهاية:", endDate, "", "", "", "الإجمالي المسلّم:", deliveredTotal],
        ["إجمالي الأوردرات:", filteredOrders.length, "", "", "", "العمولة:", totalCommission],
        ["", "", "", "", "", "المتبقي بعد العمولة:", remainingAmount],
        ["", "", "", "", "", "ربح الشركة:", companyGain],
        ["", "", "", "", "", "فلوس التاجر:", merchantMoney],
        ...Object.entries(summary).map(([status, count]) => [`${status}:`, count]),
      ],
      columns: [
        { header: "رقم الشحنة", value: (o) => o.barcode },
        { header: "اسم العميل", value: (o) => o.fullName },
        { header: "رقم العميل", value: (o) => o.phone },
        { header: "العنوان", value: (o) => o.address },
        { header: "قيمة الطلب", value: (o) => o.cost },
        { header: "حالة الشحنة", value: (o) => o.status },
        { header: "المندوب", value: (o) => o.delivery || "-" },
        { header: "الشركة", value: (o) => o.company },
        { header: "العمولة", value: (o) => (o.status === "تم التسليم" ? deliveryFee : 0) },
      ],
      rows: filteredOrders,
    });

  const allStatuses = [...new Set(orders.map((o) => o.status))];
  const allCompanies = [...new Set(orders.map((o) => o.company))];

  return (
    <div className="p-6 space-y-6">
      {/* ===== Filters ===== */}
      <div className="flex gap-4 flex-wrap mb-4">
        <select
          className="border p-2 rounded"
          value={selectedCourier}
          onChange={(e) => setSelectedCourier(e.target.value)}
        >
          <option value="">اختر مندوب</option>
          {deliveries.map((d) => (
            <option key={d._id} value={d.name}>{d.name}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">اختر الحالة</option>
          {allStatuses.map((status, idx) => (
            <option key={idx} value={status}>{status}</option>
          ))}
        </select>

        <select
          className="border p-1 rounded"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          <option value="">اختر الشركة</option>
          {allCompanies.map((company, idx) => (
            <option key={idx} value={company}>{company}</option>
          ))}
        </select>

        <div>
          <span> من :</span>
          <input
            type="date"
            className="border p-2 rounded"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <span>الى:</span>
          <input
            type="date"
            className="border p-2 rounded"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <span className="flex justify-center items-center">عمولة المندوب:</span>
        <input
          type="number"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(Number(e.target.value || 20))}
          className="border rounded px-2  w-22"
        />

        <span className="flex justify-center items-center">ربح الشركة:</span>
        <input
          type="number"
          value={companyFree}
          onChange={(e) => setCompanyFree(Number(e.target.value || 20))}
          className="border rounded px-2 py-1 w-24"
        />
      </div>

      {/* ===== Summary ===== */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(summary).map(([label, val]) => (
          <div key={label} className="p-4 rounded-lg text-center border">
            <p className="text-sm text-gray-500">{label}</p>
            <h3 className="text-xl font-bold">{val}</h3>
          </div>
        ))}

        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">الإجمالي الكلي</p>
          <h3 className="text-xl font-bold">{totalAmount} جنيه</h3>
        </div>
        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">الإجمالي المسلّم</p>
          <h3 className="text-xl font-bold">{deliveredTotal} جنيه</h3>
        </div>
        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">عمولة المندوب</p>
          <h3 className="text-xl font-bold">{totalCommission} جنيه</h3>
        </div>
        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">المتبقي بعد العمولة</p>
          <h3 className="text-xl font-bold">{remainingAmount} جنيه</h3>
        </div>
        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">ربح الشركة</p>
          <h3 className="text-xl font-bold">{companyGain} جنيه</h3>
        </div>
        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">فلوس التاجر</p>
          <h3 className="text-xl font-bold">{merchantMoney} جنيه</h3>
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-center border">
          <thead>
            <tr>
              <th className="p-2 border">رقم الشحنة</th>
              <th className="p-2 border">اسم العميل</th>
              <th className="p-2 border">رقم العميل</th>
              <th className="p-2 border">العنوان</th>
              <th className="p-2 border">قيمة الطلب</th>
              <th className="p-2 border">حالة الشحنة</th>
              <th className="p-2 border">المندوب</th>
              <th className="p-2 border">الشركة</th>
              <th className="p-2 border">العمولة</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id} className="border-b">
                <td className="p-2">{order.barcode}</td>
                <td className="p-2">{order.fullName}</td>
                <td className="p-2">{order.phone}</td>
                <td className="p-2">{order.address}</td>
                <td className="p-2">{order.cost} جنيه</td>
                <td className="p-2">{order.status}</td>
                <td className="p-2">{order.delivery}</td>
                <td className="p-2">{order.company}</td>
                <td className="p-2 text-green-600 font-bold">
                  {order.status === "تم التسليم" ? deliveryFee : 0} جنيه
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Actions ===== */}
      <div className="flex gap-4 flex-wrap">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          onClick={saveReport}
        >
          حفظ كشف الحساب
        </button>
      </div>
    </div>
  );
}
