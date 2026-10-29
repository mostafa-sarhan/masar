import Money from "@/components/ui/Money";
import { useState, useRef } from "react";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import { OrdersHeader, OrderRow } from "@/features/orders/components/OrderRow";
import { getOrderByBarcode, bulkAssign } from "@/features/orders/api/orders-api";
import { errorMessage } from "@/lib/errors";
import { printCourierSheet } from "@/features/orders/lib/print";
import type { Order, Courier } from "@/lib/types";

// Scan pending orders, then hand them all to one courier in a single request.
export default function AssignCourierPage() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedOrders, setScannedOrders] = useState<Order[]>([]);
  const [courier, setCourier] = useState("");
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [assigned, setAssigned] = useState(false);

  const totalCost = scannedOrders.reduce((sum, order) => sum + Number(order.cost || 0), 0);
  const courierName = couriers.find((c) => c._id === courier)?.name || "";

  const inputRef = useRef<HTMLInputElement>(null);
  const isScanningRef = useRef(false);

  const handleScan = async (rawValue: string) => {
    const barcode = rawValue.trim();
    if (!barcode || isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      if (scannedOrders.some((o) => o.barcode === barcode)) {
        alert("المنتج تم إضافته مسبقًا");
        return;
      }
      const order = await getOrderByBarcode(barcode);
      if (order.status !== "pending" || order.isArchived) {
        alert("هذا المنتج لا يمكن إضافته لأنه غير متاح للإضافة");
        return;
      }
      setScannedOrders((prev) => [...prev, order]);
      setAssigned(false);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBarcodeInput("");
      isScanningRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleAssign = async () => {
    if (!courier) return alert("من فضلك اختر مندوب قبل التأكيد");
    if (scannedOrders.length === 0) return alert("لا توجد أوردرات");

    try {
      await bulkAssign(scannedOrders.map((o) => o._id), courier);
      alert("تم تحديث المندوب لجميع المنتجات");
      setScannedOrders((prev) => prev.map((o) => ({ ...o, status: "with_courier" as const, courier: { _id: courier, name: courierName } })));
      setAssigned(true);
    } catch (err) {
      alert(errorMessage(err)); // nothing was changed
    }
  };

  const handlePrintAll = () => {
    if (scannedOrders.length === 0) return alert("لا توجد أوردرات للطباعة");
    if (!courier) return alert("من فضلك اختر مندوب للطباعة");
    printCourierSheet(scannedOrders, courierName);
  };

  return (
    <div className="w-[98%] m-auto mt-4">
      <div className="flex gap-4 mb-4 items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder="Scan barcode here..."
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleScan(barcodeInput);
            }
          }}
          autoFocus
          className="border-2 rounded px-3 py-2 w-64"
        />
      </div>

      <div className="flex gap-4 items-center mb-4">
        <CourierSelect value={courier} onChange={setCourier} onLoaded={setCouriers} />
        <button onClick={handleAssign} disabled={assigned} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50">
          تأكيد
        </button>
        <button onClick={handlePrintAll} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
          طباعة
        </button>
      </div>

      <div className="text-start pb-4 flex gap-16">
        <div className="text-lg font-bold">عدد الشحنات: {scannedOrders.length}</div>
        <div className="text-lg font-bold">المبلغ الكلي: <Money value={totalCost} /></div>
      </div>

      <OrdersHeader />
      <div className="my-2">
        {scannedOrders.length > 0 ? (
          scannedOrders.map((order, index) => <OrderRow key={order._id} order={order} index={index + 1} />)
        ) : (
          <p className="text-center my-4">لا توجد أوردرات</p>
        )}
      </div>
    </div>
  );
}
