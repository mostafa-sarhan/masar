import { useState } from "react";
import type { CreateOrderInput } from "@masar/shared";
import { createOrder } from "@/features/orders/api/orders-api";
import { errorMessage } from "@/lib/errors";
import OrderForm from "@/features/orders/components/OrderForm";

export default function NewOrderPage() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

  const flash = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 2500);
  };

  const handleSubmit = async (data: CreateOrderInput) => {
    try {
      const order = await createOrder(data);
      flash("success", `تم إضافة الطلب بنجاح! الباركود: ${order.barcode}`);
      setFormKey((k) => k + 1); // clear the form
    } catch (err) {
      flash("error", errorMessage(err));
    }
  };

  return (
    <div className="w-[90%] m-auto rounded-lg p-4">
      <h2 className="text-2xl font-bold mb-4">إضافة طلب جديد</h2>
      {message && (
        <div className={`text-xl p-2 my-2 rounded ${message.type === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-900"}`}>
          {message.text}
        </div>
      )}
      <OrderForm key={formKey} onSubmit={handleSubmit} />
    </div>
  );
}
