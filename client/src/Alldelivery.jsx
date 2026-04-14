import React, { useEffect, useState } from 'react';
import Barcode from './Barcode';
import DeliverySelect from './DeliverySelect';
import { formatDate } from './utils/dataUtils';

export const DELIVERY_URL = "https://sys-shipping-backend.onrender.com/orders/delivery/";
export const DELIVERY = "https://sys-shipping-backend.onrender.com/deliveries";
export const ORDERS_URL = "https://sys-shipping-backend.onrender.com/orders";

// ==========================
// helper fetch with token
// ==========================
const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("لا يوجد توكن، يرجى تسجيل الدخول");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.message || `حدث خطأ: ${res.status}`;
    throw new Error(message);
  }

  return data;
};

export default function Alldelivery() {
  const user = JSON.parse(localStorage.getItem("user"));

  // -----------------------
  // States
  // -----------------------
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryFee, setDeliveryFee] = useState(20);

  const statusOptions = ["قيد التنفيذ", "مع المندوب", "تم التسليم", "مرتجع", "استبدال", "مرفوض"];

  // -----------------------
  // Fetch Deliveries
  // -----------------------
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const data = await fetchWithToken(DELIVERY);
        setDeliveries(data);
      } catch (error) {
        console.error("فشل جلب المندوبين:", error.message);
      }
    };
    fetchDeliveries();
  }, []);

  // -----------------------
  // Fetch orders by delivery
  // -----------------------
  const fetchOrdersByDelivery = async (deliveryName) => {
    try {
      if (!deliveryName) return;
      setLoading(true);
      setOrders([]);
      console.log("Fetching orders for:", deliveryName);

      const data = await fetchWithToken(`${DELIVERY_URL}${deliveryName}`);
      const ordersWithDeliveryOnly = data.filter(order => order.status === "مع المندوب");
      setOrders(ordersWithDeliveryOnly);
    } catch (error) {
      console.error("فشل جلب الأوردرات:", error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDelivery) fetchOrdersByDelivery(selectedDelivery);
  }, [selectedDelivery]);

  // -----------------------
  // Update order status locally
  // -----------------------
  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId ? { ...order, status: newStatus, isEdited: true } : order
      )
    );
  };

  // -----------------------
  // Save all orders
  // -----------------------
  const handleSaveAllDelivered = async () => {
    try {
      setLoading(true);

      const editedOrders = orders.filter(order => order.isEdited);
      const ordersToDeliver = orders.filter(order => !order.isEdited && order.status === "مع المندوب");

      const updatePromises = [
        ...editedOrders.map(order =>
          fetchWithToken(`${ORDERS_URL}/${order._id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: order.status }),
          })
        ),
        ...ordersToDeliver.map(order =>
          fetchWithToken(`${ORDERS_URL}/${order._id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "تم التسليم" }),
          })
        ),
      ];

      await Promise.all(updatePromises);

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.isEdited
            ? { ...order, isEdited: false }
            : order.status === "مع المندوب"
            ? { ...order, status: "تم التسليم", isEdited: false }
            : { ...order, isEdited: false }
        )
      );

      alert("تم حفظ التعديلات بنجاح ✅");
    } catch (error) {
      console.error("خطأ أثناء الحفظ:", error.message);
      alert(`حصل خطأ أثناء الحفظ ❌\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // الحسابات
  // -----------------------
  const totalOrders = orders.length;
  const totalCost = orders.reduce((sum, order) => sum + Number(order.cost || 0), 0);
  const deliveredOrders = orders.filter(order => order.status === "تم التسليم");
  const totalDeliveredCost = deliveredOrders.reduce((sum, order) => sum + Number(order.cost || 0), 0);
  const totalNotDeliveredCost = totalCost - totalDeliveredCost;
  const amountDue = deliveredOrders.length * deliveryFee;
  const remainingAmount = totalDeliveredCost - amountDue;

  // -----------------------
  // JSX
  // -----------------------
  return (
    <div className="w-[98%] m-auto mt-4">
      {/* اختيار المندوب */}
      <div className="flex gap-4 items-center mb-4">
        <DeliverySelect value={selectedDelivery} onChange={setSelectedDelivery} />
        {user?.role === "admin" && (
          <>
            <span>عمولة المندوب:</span>
            <input
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value || 0))}
              className="border rounded px-2 py-1 w-24"
            />
            <span>جنيه</span>
          </>
        )}
      </div>

      {loading && <p className="text-center my-4 text-xl">جاري تحميل الأوردرات...</p>}

      {selectedDelivery && (
        <div className="rounded-lg p-4 mb-4 flex gap-8 justify-between items-center">
          <div className="text-xl w-[50%] flex justify-around items-center">
            <div>المندوب: <span className="font-bold mr-2">{selectedDelivery}</span></div>
            <div>عدد الأوردرات: <span className="font-bold mr-2">{totalOrders}</span></div>
          </div>
          <div className="text-sm w-[50%]">
            إجمالي المبلغ: <span className="font-bold mr-2">{totalCost} جنيه</span>
            <div className="text-sm">
              المبلغ المستحق للمندوب: <span className="font-bold mr-2">{amountDue} جنيه</span>
              <div className="text-sm">
                اجمالى المبلغ المرفوض: <span className="font-bold mr-2">{totalNotDeliveredCost} جنيه</span>
              </div>
              <div className="text-sm">
                الباقي بعد خصم المستحق: <span className="font-bold mr-2">{remainingAmount} جنيه</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="orders-grid border-2 rounded-lg font-bold">
        <div className="orders-cell">العدد</div>
        <div className="orders-cell">التاريخ</div>
        <div className="orders-cell">الباركود</div>
        <div className="orders-cell">العنوان</div>
        <div className="orders-cell">المرسل إليه</div>
        <div className="orders-cell">الحالة</div>
        <div className="orders-cell">الشركة</div>
        <div className="orders-cell">المندوب</div>
        <div className="orders-cell">المبلغ</div>
        <div className="orders-cell">ملاحظه</div>
      </div>

      {/* Table Rows */}
      <div className="my-2">
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <div key={order._id || index} className="w-full m-auto">
              <div className="orders-grid border-x-2 border-t-2">
                <div className="orders-cell flex-col"><span className="text-sm">{index + 1}</span></div>
                <div className="orders-cell flex-col"><span className="text-sm">{formatDate(order.createdAt)}</span></div>
                <div className="orders-cell"><Barcode value={order.barcode} /></div>
                <div className="orders-cell">{order.address}</div>
                <div className="orders-cell flex-col"><span>{order.fullName}</span><span className="text-sm">{order.phone}</span></div>
                <div className="orders-cell">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="border px-2 py-1 rounded"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="orders-cell">{order.company}</div>
                <div className="orders-cell">{order.delivery || "-"}</div>
                <div className="orders-cell font-bold">{order.cost}</div>
                <div className="orders-cell"></div>
              </div>
            </div>
          ))
        ) : (
          !loading && <p className="text-center my-4">لا توجد أوردرات مع المندوب</p>
        )}
      </div>

      {/* زرار حفظ الجميع */}
      {orders.length > 0 && (
        <div className="my-4 flex justify-end">
          <button
            onClick={handleSaveAllDelivered}
            className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer"
          >
            حفظ الجميع
          </button>
        </div>
      )}
    </div>
  );
}
