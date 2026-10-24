import React, { useState, useRef } from 'react';
import PrintAllLabels from './PrintAllLabels';
import DeliverySelect from './DeliverySelect';
import { OrdersHeader, OrderRow } from './OrderRow';
import { getOrderByBarcode, updateOrder } from './services/ordersApi';
import { PENDING, WITH_COURIER } from './utils/orderStatus';

export default function AddDelivery() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedOrders, setScannedOrders] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [printOrders, setPrintOrders] = useState(false);

  const totalCost = scannedOrders.reduce((sum, order) => sum + Number(order.cost || 0), 0);

  const inputRef = useRef(null);
  const isScanningRef = useRef(false);

  // -----------------------
  // Handle Scan
  // -----------------------
  const handleScan = async (rawValue) => {
    const barcode = rawValue.trim();
    if (!barcode || isScanningRef.current) return;

    isScanningRef.current = true;

    const alreadyAdded = scannedOrders.some(order => order.barcode === barcode);
    if (alreadyAdded) {
      alert("المنتج تم إضافته مسبقًا");
      setBarcodeInput("");
      isScanningRef.current = false;
      return;
    }

    try {
      const data = await getOrderByBarcode(barcode);

      if (data.status !== PENDING) {
        alert("هذا المنتج لا يمكن إضافته لأنه غير متاح للإضافة");
        return;
      }

      setScannedOrders(prev => [...prev, data]);
      setBarcodeInput("");
    } catch (error) {
      console.error(error);
      alert("فشل جلب الطلب من السيرفر");
    } finally {
      isScanningRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // -----------------------
  // Update Order Delivery
  // -----------------------
  const updateOrderDelivery = async (orderId, delivery) => {
    try {
      return await updateOrder(orderId, { delivery, status: WITH_COURIER });
    } catch (error) {
      console.error(error);
      alert("فشل تحديث المنتج في السيرفر");
    }
  };

  // -----------------------
  // Assign Delivery
  // -----------------------
  const handleAssignDelivery = async () => {
    if (!selectedDelivery) {
      alert("من فضلك اختر مندوب قبل التأكيد");
      return;
    }

    const updatedOrders = [];
    for (const order of scannedOrders) {
      const updated = await updateOrderDelivery(order._id, selectedDelivery);
      if (updated) updatedOrders.push(updated);
    }

    setScannedOrders(updatedOrders);
    alert("تم تحديث المندوب لجميع المنتجات في الداتا بيز");
  };

  // -----------------------
  // Print
  // -----------------------
  const handlePrintAll = () => {
    if (scannedOrders.length === 0) {
      alert("لا توجد أوردرات للطباعة");
      return;
    }
    if (!selectedDelivery) {
      alert("من فضلك اختر مندوب للطباعة");
      return;
    }
    setPrintOrders(true);
  };

  // -----------------------
  // Enter key
  // -----------------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan(barcodeInput);
    }
  };

  // -----------------------
  // JSX
  // -----------------------
  return (
    <div className="w-[98%] m-auto mt-4">

      <div className="flex gap-4 mb-4 items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder="Scan barcode here..."
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="border-2 rounded px-3 py-2 w-64"
        />
      </div>

      <div className="flex gap-4 items-center mb-4">
        <DeliverySelect
          value={selectedDelivery}
          onChange={setSelectedDelivery}
        />

        <button
          onClick={handleAssignDelivery}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          تأكيد
        </button>

        <button
          onClick={handlePrintAll}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          طباعة
        </button>
      </div>

      <div className='text-start pb-4 flex gap-16'>
        <div className="text-lg font-bold">
          عدد الشحنات: {scannedOrders.length}
        </div>
        <div className="text-lg font-bold">
          المبلغ الكلي: {totalCost} جنيه
        </div>
      </div>

      <OrdersHeader />

      <div className="my-2">
        {scannedOrders.length > 0 ? (
          scannedOrders.map((order, index) => (
            <OrderRow key={order._id} order={order} index={index + 1} />
          ))
        ) : (
          <p className="text-center my-4">لا توجد أوردرات</p>
        )}
      </div>

      {printOrders && (
        <PrintAllLabels
          orders={scannedOrders}
          deliveryName={selectedDelivery}
        />
      )}
    </div>
  );
}
