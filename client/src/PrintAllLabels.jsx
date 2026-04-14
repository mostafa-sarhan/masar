// PrintAllLabels.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Barcode from './Barcode';

export default function PrintAllLabels({ orders, deliveryName }) {

  const formatDateForPrint = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // الشهور من 0
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};


  useEffect(() => {
    if (!orders || orders.length === 0) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Print Orders</title></head><body>');
    printWindow.document.write('<div id="print-root"></div>');
    printWindow.document.write('</body></html>');

    const root = ReactDOM.createRoot(printWindow.document.getElementById('print-root'));

    // نحسب المجموع وعدد الأوردرات
    const totalOrders = orders.length;
    const totalCost = orders.reduce((sum, order) => sum + Number(order.cost || 0), 0);

    const TableContent = () => (
      <div style={{textAlign: "center"}}>
        <h2>المندوب: {deliveryName}</h2>
        <h3>عدد الأوردرات: {totalOrders} - المجموع: {totalCost}</h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid black" }}>التاريخ</th>
              <th style={{ border: "1px solid black" }}>الباركود</th>
              <th style={{ border: "1px solid black" }}>العنوان</th>
              <th style={{ border: "1px solid black" }}>المرسل إليه</th>
              {/* <th style={{ border: "1px solid black" }}>الحالة</th> */}
              <th style={{ border: "1px solid black" }}>الشركة</th>
              <th style={{ border: "1px solid black" }}>المندوب</th>
              <th style={{ border: "1px solid black" }}>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid black", textAlign: "center" ,width :"150px"  }}>{formatDateForPrint(order.createdAt)}</td>
                <td style={{ border: "1px solid black", textAlign: "center" }}>
                  <Barcode value={order.barcode} />
                </td>
                <td style={{ border: "1px solid black", textAlign: "center", width :"150px" }}>{order.address}</td>
                <td style={{ border: "1px solid black", textAlign: "center" , width :"150px" }}>
                  {order.fullName} <br /> {order.phone}
                </td>
                {/* <td style={{ border: "1px solid black", textAlign: "center" }}>{order.status}</td> */}
                <td style={{ border: "1px solid black", textAlign: "center" , width :"90px" }}>{order.company}</td>
                <td style={{ border: "1px solid black", textAlign: "center" , width :"130px" }}>{order.delivery || "-"}</td>
                <td style={{ border: "1px solid black", textAlign: "center"  , width :"90px"}}>{order.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    root.render(<TableContent />);

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

  }, [orders, deliveryName]);

  return null;
}
