import React, { useState } from 'react';
import DeliverySelect from './DeliverySelect';
import { OrdersHeader, OrderRow } from './OrderRow';
import { getOrdersByDelivery, updateOrder } from './services/ordersApi';
import { getUser } from './services/session';
import { ORDER_STATUSES, DELIVERED, WITH_COURIER } from './utils/orderStatus';

export default function Alldelivery() {
  const user = getUser();

  // -----------------------
  // States
  // -----------------------
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(20);

  // -----------------------
  // Fetch orders by delivery
  // -----------------------
  const fetchOrdersByDelivery = async (deliveryName) => {
    try {
      if (!deliveryName) return;
      setLoading(true);
      setOrders([]);
      const data = await getOrdersByDelivery(deliveryName);
      const ordersWithDeliveryOnly = data.filter(order => order.status === WITH_COURIER);
      setOrders(ordersWithDeliveryOnly);
    } catch (error) {
      console.error("فشل جلب الأوردرات:", error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDelivery = (deliveryName) => {
    setSelectedDelivery(deliveryName);
    if (deliveryName) fetchOrdersByDelivery(deliveryName);
    else setOrders([]);
  };

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

      // Edited rows keep their chosen status; untouched rows still "with courier" become delivered.
      const finalStatus = (order) => (!order.isEdited && order.status === WITH_COURIER ? DELIVERED : order.status);

      await Promise.all(
        orders
          .filter(order => order.isEdited || order.status === WITH_COURIER)
          .map(order => updateOrder(order._id, { status: finalStatus(order) }))
      );

      setOrders(prevOrders => prevOrders.map(order => ({ ...order, status: finalStatus(order), isEdited: false })));

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
  const deliveredOrders = orders.filter(order => order.status === DELIVERED);
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
        <DeliverySelect value={selectedDelivery} onChange={handleSelectDelivery} />
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

      <OrdersHeader />

      {/* Table Rows */}
      <div className="my-2">
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <OrderRow
              key={order._id}
              order={order}
              index={index + 1}
              status={
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  className="border px-2 py-1 rounded"
                >
                  {ORDER_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              }
            />
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
