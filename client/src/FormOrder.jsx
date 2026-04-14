import React, { useState } from 'react';
import { convertArabicNumbersToEnglish } from './utils/numberUtils';
import DeliverySelect from './DeliverySelect';


export default function FormOrder({ initialData = {}, onSubmit }) {
  // -----------------------
  // State variables مع قيم افتراضية
  // -----------------------
  const [fullName, setFullName] = useState(initialData.fullName || "");
  const [address, setAddress] = useState(initialData.address || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [cost, setCost] = useState(initialData.cost || "");
  const [company, setCompany] = useState(initialData.company || "");
  const [status, setStatus] = useState(initialData.status || "قيد التنفيذ"); // افتراضي: قيد التنفيذ
  const [delivery, setDelivery] = useState(initialData.delivery || "لم يحدد"); // افتراضي: لم يحدد

  // -----------------------
  // Handle Form Submission
  // -----------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    // لو المستخدم مسكش حالة أو مندوب، نرسل الافتراضي
    const finalStatus = status || "قيد التنفيذ";
    const finalDelivery = delivery || "لم يحدد";

    // تمرير البيانات للأب component عبر onSubmit
    onSubmit({ fullName, address, phone, cost, company, status: finalStatus, delivery: finalDelivery });
  };

  return (
    <form className='grid grid-cols-2 gap-8 w-[90%]' onSubmit={handleSubmit}>

      {/* الاسم */}
      <div className='flex flex-col'>
        <label className='mb-1 text-2xl text-right'>اسم العميل</label>
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className='border rounded-lg p-2'
          required
        />
      </div>

      {/* الهاتف */}
      <div className='flex flex-col'>
        <label className='mb-1 text-2xl text-right'>رقم الهاتف</label>
        <input
          value={phone}
          onChange={e => setPhone(convertArabicNumbersToEnglish(e.target.value))}
          className='border rounded-lg p-2'
          required
        />
      </div>

      {/* العنوان */}
      <div className='flex flex-col'>
        <label className='mb-1 text-2xl text-right'>العنوان</label>
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          className='border rounded-lg p-2'
          required
        />
      </div>

      {/* المبلغ */}
      <div className='flex flex-col'>
        <label className='mb-1 text-2xl text-right'>المبلغ</label>
        <input
          value={cost}
          onChange={e => setCost(convertArabicNumbersToEnglish(e.target.value))}
          className='border rounded-lg p-2'
          required
        />
      </div>

      {/* الشركة */}
      <div className='flex flex-col'>
        <label className='mb-1 text-2xl text-right'>اسم الشركة</label>
        <input
          value={company}
          onChange={e => setCompany(e.target.value)}
          className='border rounded-lg p-2'
          required
        />
      </div>

      {/* المندوب */}
      <div className='flex flex-col'>
        <label className='mb-1 text-2xl text-right'>اسم المندوب</label>
        <DeliverySelect
          value={delivery}        // نربطها بالحالة الموجودة delivery
          onChange={setDelivery}  // لما المستخدم يختار، الحالة تتحدث مباشرة
        />
      </div>

      {/* الحالة */}
      <div className='flex flex-col'>
        <label className='mb-1 text-2xl text-right'>الحالة</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className='border rounded-lg p-2'
        >
          <option value="قيد التنفيذ">قيد التنفيذ</option>
          <option value="مع المندوب">مع المندوب</option>
          <option value="تم التسليم">تم التسليم</option>
          <option value="مرتجع">مرتجع</option>
          <option value="مرفوض">مرفوض</option>
        </select>
      </div>

      {/* زر الحفظ */}
      <div className="col-span-2">
        <button className="bg-blue-500 text-white text-2xl w-full py-2 rounded cursor-pointer">
          حفظ
        </button>
      </div>
    </form>
  );
}
