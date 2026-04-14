// PrintLabel.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Label from './Label';

export default function PrintLabel({ order }) {

  useEffect(() => {
    const printWindow = window.open('', '_blank', 'width=500,height=600');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Print</title></head><body>');
    printWindow.document.write('<div id="print-root"></div>');
    printWindow.document.write('</body></html>');

    const root = ReactDOM.createRoot(printWindow.document.getElementById('print-root'));
    root.render(<Label order={order} />);

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500); // نص ثانية للتأكد ان الباركود اتحمل
  }, [order]);

  return null; // مش هنعرض أي حاجة داخل الDOM الرئيسي
}
