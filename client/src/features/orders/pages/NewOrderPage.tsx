import React, { useState } from "react";
import { createOrder } from "./services/ordersApi";
import { errorMessage } from "./services/errors";
import FormOrder from "./FormOrder";

export default function Neworder() {
  const [message, setMessage] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 2500);
  };

  const handleSubmit = async (data) => {
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
      <FormOrder key={formKey} onSubmit={handleSubmit} />
    </div>
  );
}
