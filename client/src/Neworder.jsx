import React, { useState } from 'react'
import { createOrder } from './services/ordersApi';
import FormOrder from './FormOrder';

export default function Neworder() {


// Message Successful and Failed
  const [successMessage, setSuccessMessage] = useState("");
  const [failedMessage, setFailedMessage] = useState("");


const handleSubmit = async (data) => {
  try {
    const result = await createOrder(data);
    console.log("تمت إضافة الطلب:", result);

    setSuccessMessage("تم إضافة الطلب بنجاح!");
    setTimeout(() => setSuccessMessage(""), 1500);

  } catch (err) {
    console.error(err);
    setFailedMessage("جميع الحقول مطلوبة!");
    setTimeout(() => setFailedMessage(""), 1500);
  }
};


  return (
    <div className='w-[90%] m-auto rounded-lg p-4'>
      <h2 className='text-2xl font-bold mb-4'>إضافة طلب جديد</h2>
      {successMessage && (
          <div className="bg-green-200 text-green-800 text-xl p-2 my-2 rounded">
            {successMessage}
          </div>
      )}
      {failedMessage && (
          <div className="bg-red-200 text-red-900 text-xl p-2 my-2 rounded">
            {failedMessage}
          </div>
      )}

      <FormOrder onSubmit={handleSubmit}/>




    </div>
  )
}
