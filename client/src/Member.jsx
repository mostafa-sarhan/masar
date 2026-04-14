import React, { useEffect, useState } from "react";

const ORDERS_URL = "https://sys-shipping-backend.onrender.com/orders";
const MERCHANTS_URL = "https://sys-shipping-backend.onrender.com/merchants";
const CREATE_MERCHANT_URL = "https://sys-shipping-backend.onrender.com/merchants";

// ==========================
// helper fetch with token
// ==========================
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

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `حدث خطأ في السيرفر: ${res.status}`);
  }

  return res.json();
};

export default function Member() {
  const [merchants, setMerchants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [merchantName, setMerchantName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [companyFee, setCompanyFee] = useState(20);

  // =====================
  // Fetch data
  // =====================
  const fetchData = async () => {
    try {
      setLoading(true);
      const [merchantsData, ordersData] = await Promise.all([
        fetchWithToken(MERCHANTS_URL),
        fetchWithToken(ORDERS_URL),
      ]);

      setMerchants(merchantsData.merchants || merchantsData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error("Fetch error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================
  // Add merchant
  // =====================
  const handleAddMerchant = async () => {
    if (!merchantName.trim()) return alert("اسم التاجر مطلوب");

    try {
      setAdding(true);
      const data = await fetchWithToken(CREATE_MERCHANT_URL, {
        method: "POST",
        body: JSON.stringify({ name: merchantName }),
      });

      // أضف التاجر مباشرة للـ state
      setMerchants(prev => [...prev, data]);
      setMerchantName("");
      setShowAdd(false);
    } catch (error) {
      console.error(error);
      alert("حصل خطأ أثناء إضافة التاجر: " + error.message);
    } finally {
      setAdding(false);
    }
  };

  // =====================
  // Merchants summary
  // =====================
  const merchantSummary = merchants.map((merchant) => {
    const merchantOrders = orders.filter((o) => o.company === merchant.name);

    return {
      id: merchant.id || merchant._id,
      name: merchant.name,
      total: merchantOrders.length,
      delivered: merchantOrders.filter((o) => o.status === "تم التسليم").length,
      returned: merchantOrders.filter((o) => o.status === "مرتجع").length,
      rejected: merchantOrders.filter((o) => o.status === "مرفوض").length,
      inProgress: merchantOrders.filter((o) => o.status === "قيد التنفيذ").length,
      replacement: merchantOrders.filter((o) => o.status === "استبدال").length,
      withCourier: merchantOrders.filter((o) => o.status === "مع المندوب").length,
    };
  });

  const merchantMoneySummary = merchants.map((merchant) => {
    const merchantOrders = orders.filter(
      (o) => o.company === merchant.name && o.status === "تم التسليم"
    );

    const deliveredCount = merchantOrders.length;
    const deliveredTotal = merchantOrders.reduce(
      (sum, o) => sum + (Number(o.cost) || 0),
      0
    );

    const companyCommission = deliveredCount * companyFee;
    const merchantNet = deliveredTotal - companyCommission;

    return {
      id: merchant.id || merchant._id,
      name: merchant.name,
      deliveredCount,
      deliveredTotal,
      companyCommission,
      merchantNet,
    };
  });

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center text-xl">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10">

      {/* Actions */}
      <div className="flex flex-wrap gap-4 items-center">
        <button
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          onClick={() => setShowAdd(true)}
        >
          ➕ إضافة تاجر
        </button>

        <div className="flex items-center gap-2">
          <label className="font-bold">عمولة الشركة:</label>
          <input
            type="number"
            value={companyFee}
            onChange={(e) => setCompanyFee(Number(e.target.value))}
            className="w-24 px-2 py-1 rounded bg-gray-800 border"
          />
          <span>جنيه / أوردر</span>
        </div>
      </div>

      {/* Merchants Table */}
      <div>
        <h2 className="text-2xl font-bold mb-4">ملخص أوردرات التجار</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-center text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-2 border">التاجر</th>
                <th className="p-2 border">الإجمالي</th>
                <th className="p-2 border">تم التسليم</th>
                <th className="p-2 border">مرتجع</th>
                <th className="p-2 border">مرفوض</th>
                <th className="p-2 border">قيد التنفيذ</th>
                <th className="p-2 border">استبدال</th>
                <th className="p-2 border">مع المندوب</th>
              </tr>
            </thead>
            <tbody>
              {merchantSummary.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-800">
                  <td className="p-2 font-bold">{m.name}</td>
                  <td className="p-2">{m.total}</td>
                  <td className="p-2 text-green-500">{m.delivered}</td>
                  <td className="p-2 text-yellow-400">{m.returned}</td>
                  <td className="p-2 text-red-500">{m.rejected}</td>
                  <td className="p-2">{m.inProgress}</td>
                  <td className="p-2">{m.replacement}</td>
                  <td className="p-2">{m.withCourier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Money Table */}
      <div>
        <h2 className="text-2xl font-bold mb-4">الحسابات المالية للتجار</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-center text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-2 border">التاجر</th>
                <th className="p-2 border">عدد المسلّم</th>
                <th className="p-2 border">إجمالي المسلّم</th>
                <th className="p-2 border">عمولة الشركة</th>
                <th className="p-2 border">صافي التاجر</th>
              </tr>
            </thead>
            <tbody>
              {merchantMoneySummary.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-800">
                  <td className="p-2 font-bold">{m.name}</td>
                  <td className="p-2">{m.deliveredCount}</td>
                  <td className="p-2">{m.deliveredTotal} جنيه</td>
                  <td className="p-2 text-yellow-400">{m.companyCommission} جنيه</td>
                  <td className="p-2 text-green-500 font-bold">{m.merchantNet} جنيه</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Merchant Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[350px]">
            <h3 className="text-xl font-bold mb-4">إضافة تاجر جديد</h3>

            <input
              type="text"
              placeholder="اسم التاجر"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded bg-gray-800 border"
            />

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-600 rounded"
                onClick={() => setShowAdd(false)}
              >
                إلغاء
              </button>

              <button
                disabled={adding}
                className="px-4 py-2 bg-green-600 rounded"
                onClick={handleAddMerchant}
              >
                {adding ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merchants Info Table */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">بيانات التجار</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-center text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-2 border">اسم التاجر</th>
                <th className="p-2 border">API Key</th>
                <th className="p-2 border">تاريخ الإنشاء</th>
              </tr>
            </thead>

            <tbody>
              {merchants.length > 0 ? (
                merchants.map((m) => (
                  <tr key={m._id || m.id} className="border-b hover:bg-gray-800">
                    <td className="p-2 font-bold">{m.name}</td>
                    <td className="p-2 text-yellow-400 break-all">{m.apiKey}</td>
                    <td className="p-2">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-4">لا يوجد تجار</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
