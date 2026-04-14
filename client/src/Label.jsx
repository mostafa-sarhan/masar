import React from 'react';
import Barcode from './Barcode';

export default function Label({ order }) {
    return (
        <div className='label text-center border' style={{ width: '200px', fontSize: '12px' }}>
            <div className="barcode " style={{ marginBottom: '2px' }}>
                <Barcode value={order.barcode} />
            </div>
            <div className="info ">
                <p><strong>الاسم:</strong> {order.fullName}</p>
                <p><strong>العنوان:</strong> {order.address}</p>
                <p><strong>رقم الهاتف:</strong> {order.phone}</p>
                <p><strong>التكلفة:</strong> {order.cost} جنيه</p>
            </div>
        </div>
  )
}
