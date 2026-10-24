import React, { useEffect, useState } from "react";
import { exportOrders } from "./services/ordersApi";
import { downloadReport } from "./utils/excel";

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
        const dataOrders = await exportOrders({ archived: "all" });
        setOrders(dataOrders || []);

        const uniqueCompanies = [...new Set(dataOrders.map((o) => o.company))];
        setCompanies(uniqueCompanies);
      } catch (err) {
        console.error("فشل جلب البيانات:", err);
      }
    };
    getData();
  }, []);

  // فلترة الأوردرات حسب الشركة والتاريخ (تاريخ النهاية شامل اليوم كله)
  const filteredOrders = orders.filter((order) => {
    const day = order.createdAt?.slice(0, 10);
    const afterStart = startDate ? day >= startDate : true;
    const beforeEnd = endDate ? day <= endDate : true;
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

  const saveReport = () =>
    downloadReport({
      fileName: `كشف_حساب_${selectedCompany || "جميع"}`,
      sheetName: "كشف الحساب",
      summary: [
        ["تاريخ البداية:", startDate, "", "", "", "المبلغ المستلم:", totalReceived],
        ["تاريخ النهاية:", endDate, "", "", "", "المتبقي بعد خصم عمولة المندوب:", remainingAfterCourier],
        ["إجمالي الأوردرات:", filteredOrders.length, "", "", "", "فلوس التاجر بعد الخصم:", totalMerchant],
        ["", "", "", "", "", "ربح الشركة:", companyProfit],
        ...Object.entries(summary).map(([status, val]) => [`${status}:`, val.count, "المبلغ:", val.amount]),
      ],
      columns: [
        { header: "رقم الشحنة", value: (o) => o.barcode },
        { header: "اسم العميل", value: (o) => o.fullName },
        { header: "قيمة الطلب", value: (o) => o.cost },
        { header: "حالة الشحنة", value: (o) => o.status },
        { header: "المندوب", value: (o) => o.delivery || "-" },
        { header: "الشركة", value: (o) => o.company },
        { header: "المبلغ بعد خصم عمولة المندوب", value: (o) => (o.status === "تم التسليم" ? o.cost - deliveryFee : o.cost) },
        { header: "فلوس التاجر بعد الخصم", value: (o) => (o.status === "تم التسليم" ? o.cost - deliveryFee - companyFree : 0) },
      ],
      rows: filteredOrders,
    });

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
