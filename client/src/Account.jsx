import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const URL = "https://sys-shipping-backend.onrender.com/orders";

const fetchWithToken = async (url) => {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`حدث خطأ في السيرفر: ${res.status}`);
  return res.json();
};

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
        const dataOrders = await fetchWithToken(URL);
        setOrders(dataOrders || []);

        const dataDeliveries = await fetchWithToken(
          "https://sys-shipping-backend.onrender.com/deliveries"
        );
        setDeliveries(dataDeliveries || []);
      } catch (err) {
        console.error("فشل جلب البيانات:", err);
      }
    };
    getOrders();
  }, []);

  // ===== فلترة الأوردرات حسب المندوب، الحالة، الشركة والتاريخ =====
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const afterStart = startDate ? orderDate >= new Date(startDate) : true;
    const beforeEnd = endDate ? orderDate <= new Date(endDate) : true;
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
  const saveReport = () => {
    const dataToSave = filteredOrders.map((order) => ({
      "رقم الشحنة": order.barcode,
      "اسم العميل": order.fullName,
      "رقم العميل": order.phone,
      "العنوان": order.address,
      "قيمة الطلب": order.cost,
      "حالة الشحنة": order.status,
      "المندوب": order.delivery || "-",
      "الشركة": order.company,
      "العمولة": order.status === "تم التسليم" ? deliveryFee : 0,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToSave, { origin: 10 });
    XLSX.utils.sheet_add_aoa(ws, [["تاريخ البداية:", startDate]], { origin: "A1" });
    XLSX.utils.sheet_add_aoa(ws, [["تاريخ النهاية:", endDate]], { origin: "A2" });
    XLSX.utils.sheet_add_aoa(ws, [["إجمالي الأوردرات:", filteredOrders.length]], { origin: "A3" });
    XLSX.utils.sheet_add_aoa(ws, [["تم التسليم:", summary.delivered]], { origin: "A4" });
    XLSX.utils.sheet_add_aoa(ws, [["مرتجع:", summary.returned]], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(ws, [["مرفوض:", summary.rejected]], { origin: "A6" });
    XLSX.utils.sheet_add_aoa(ws, [["قيد التنفيذ:", summary.inProgress]], { origin: "A7" });
    XLSX.utils.sheet_add_aoa(ws, [["استبدال:", summary.replacement]], { origin: "A8" });
    XLSX.utils.sheet_add_aoa(ws, [["مع المندوب:", summary.withCourier]], { origin: "A9" });
    XLSX.utils.sheet_add_aoa(ws, [["الإجمالي الكلي:", totalAmount]], { origin: "F3" });
    XLSX.utils.sheet_add_aoa(ws, [["الإجمالي المسلّم:", deliveredTotal]], { origin: "F4" });
    XLSX.utils.sheet_add_aoa(ws, [["العمولة:", totalCommission]], { origin: "F5" });
    XLSX.utils.sheet_add_aoa(ws, [["المتبقي بعد العمولة:", remainingAmount]], { origin: "F6" });
    XLSX.utils.sheet_add_aoa(ws, [["ربح الشركة:", companyGain]], { origin: "F7" });
    XLSX.utils.sheet_add_aoa(ws, [["فلوس التاجر:", merchantMoney]], { origin: "F8" });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "كشف الحساب");
    XLSX.writeFile(wb, `كشف_الحساب_${selectedCourier || "جميع"}_${Date.now()}.xlsx`);
  };

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
