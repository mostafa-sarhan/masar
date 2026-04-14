import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export const ORDERS_URL = "https://sys-shipping-backend.onrender.com/orders";

const fetchWithToken = async (url) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("لا يوجد توكن");
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`حدث خطأ في السيرفر: ${res.status}`);
  return res.json();
};

export default function Company() {
  const [deliveryFee, setDeliveryFee] = useState(20);
  const [companyFree, setCompanyFree] = useState(20);
  const [orders, setOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const getData = async () => {
      try {
        const dataOrders = await fetchWithToken(ORDERS_URL);
        setOrders(dataOrders || []);

        const uniqueCompanies = [...new Set(dataOrders.map((o) => o.company))];
        setCompanies(uniqueCompanies);
      } catch (err) {
        console.error("فشل جلب البيانات:", err);
      }
    };
    getData();
  }, []);

  // فلترة الأوردرات حسب الشركة والتاريخ
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const afterStart = startDate ? orderDate >= new Date(startDate) : true;
    const beforeEnd = endDate ? orderDate <= new Date(endDate) : true;
    const companyMatch = selectedCompany ? order.company === selectedCompany : true;
    return afterStart && beforeEnd && companyMatch;
  });

  // ملخص لكل حالة: عدد + مبلغ
  const getSummary = (status) => {
    const ordersByStatus = filteredOrders.filter(o => o.status === status);
    const amount = ordersByStatus.reduce((acc, o) => acc + Number(o.cost || 0), 0);
    return { count: ordersByStatus.length, amount };
  };

  const summary = {
    "تم التسليم": getSummary("تم التسليم"),
    "قيد التنفيذ": getSummary("قيد التنفيذ"),
    "مرتجع": getSummary("مرتجع"),
    "مرفوض": getSummary("مرفوض"),
    "استبدال": getSummary("استبدال")
  };

  const deliveredOrders = filteredOrders.filter(o => o.status === "تم التسليم");
  const totalReceived = deliveredOrders.reduce((acc, o) => acc + Number(o.cost || 0), 0);
  const totalCourier = deliveredOrders.length * deliveryFee;
  const remainingAfterCourier = totalReceived - totalCourier;
  const totalMerchant = remainingAfterCourier - deliveredOrders.length * companyFree;
  const companyProfit = deliveredOrders.length * companyFree;

  const saveReport = () => {
    const dataToSave = filteredOrders.map(order => ({
      "رقم الشحنة": order.barcode,
      "اسم العميل": order.fullName,
      "قيمة الطلب": order.cost,
      "حالة الشحنة": order.status,
      "المندوب": order.delivery || "-",
      "الشركة": order.company,
      "المبلغ بعد خصم عمولة المندوب": order.status === "تم التسليم" ? order.cost - deliveryFee : order.cost,
      "فلوس التاجر بعد الخصم": order.status === "تم التسليم" ? order.cost - deliveryFee - companyFree : 0,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToSave);
    XLSX.utils.sheet_add_aoa(ws, [["تاريخ البداية:", startDate]], { origin: "A1" });
    XLSX.utils.sheet_add_aoa(ws, [["تاريخ النهاية:", endDate]], { origin: "A2" });
    XLSX.utils.sheet_add_aoa(ws, [["إجمالي الأوردرات:", filteredOrders.length]], { origin: "A3" });
    XLSX.utils.sheet_add_aoa(ws, [["تم التسليم:", summary["تم التسليم"].count, "المبلغ:", summary["تم التسليم"].amount]], { origin: "A4" });
    XLSX.utils.sheet_add_aoa(ws, [["قيد التنفيذ:", summary["قيد التنفيذ"].count, "المبلغ:", summary["قيد التنفيذ"].amount]], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(ws, [["مرتجع:", summary["مرتجع"].count, "المبلغ:", summary["مرتجع"].amount]], { origin: "A6" });
    XLSX.utils.sheet_add_aoa(ws, [["مرفوض:", summary["مرفوض"].count, "المبلغ:", summary["مرفوض"].amount]], { origin: "A7" });
    XLSX.utils.sheet_add_aoa(ws, [["استبدال:", summary["استبدال"].count, "المبلغ:", summary["استبدال"].amount]], { origin: "A8" });
    XLSX.utils.sheet_add_aoa(ws, [["المبلغ المستلم:", totalReceived]], { origin: "F3" });
    XLSX.utils.sheet_add_aoa(ws, [["المتبقي بعد خصم عمولة المندوب:", remainingAfterCourier]], { origin: "F4" });
    XLSX.utils.sheet_add_aoa(ws, [["فلوس التاجر بعد الخصم:", totalMerchant]], { origin: "F5" });
    XLSX.utils.sheet_add_aoa(ws, [["ربح الشركة:", companyProfit]], { origin: "F6" });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "كشف الحساب");
    XLSX.writeFile(
      wb,
      `كشف_حساب_${selectedCompany || "جميع"}_${Date.now()}.xlsx`
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* ===== الفلاتر ===== */}
      <div className="flex gap-4 flex-wrap mb-4">
        <select
          className="border p-2 rounded"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          <option value="">اختر الشركة</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div>
          <span> من :</span>
          <input type="date" className="border p-2 rounded" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <span>الى:  </span>
          <input type="date" className="border p-2 rounded" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <span className="mx-2">عمولة المندوب:</span>
        <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value || 20))} className="border rounded px-2 py-1 w-24" />
        <span className="mx-2">عمولة الشركة:</span>
        <input type="number" value={companyFree} onChange={e => setCompanyFree(Number(e.target.value || 10))} className="border rounded px-2 py-1 w-24" />
      </div>

      {/* ===== الملخص ===== */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        {Object.entries(summary).map(([key, val]) => (
          <div key={key} className="p-4 rounded-lg text-center border">
            <p className="text-sm text-gray-500">{key}</p>
            <h3 className="text-xl font-bold">{val.count}</h3>
            <h3 className="text-xl font-bold">{val.amount} جنيه</h3>
          </div>
        ))}

        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">المبلغ المستلم</p>
          <h3 className="text-xl font-bold">{totalReceived} جنيه</h3>
        </div>
        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">عمولة المندوب</p>
          <h3 className="text-xl font-bold">{totalCourier} جنيه</h3>
        </div>
        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">المتبقي بعد خصم عمولة المندوب</p>
          <h3 className="text-xl font-bold">{remainingAfterCourier} جنيه</h3>
        </div>
        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">فلوس التاجر بعد الخصم</p>
          <h3 className="text-xl font-bold">{totalMerchant} جنيه</h3>
        </div>
        <div className="p-4 rounded-lg text-center border">
          <p className="text-sm text-gray-500">ربح الشركة</p>
          <h3 className="text-xl font-bold">{companyProfit} جنيه</h3>
        </div>
      </div>

      {/* ===== زر حفظ التقرير ===== */}
      <div className="flex gap-4 flex-wrap">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={saveReport}>
          حفظ كشف الحساب
        </button>
      </div>
    </div>
  );
}
