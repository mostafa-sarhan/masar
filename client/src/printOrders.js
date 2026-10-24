import { escapeHtml } from "./utils/html";
import { formatDate } from "./utils/dataUtils";

// Opens a print window with a table of the given orders.
export function printOrdersTable(orders) {
  const printWindow = window.open("", "", "height=800,width=1000");
  if (!printWindow) return;

  const totalCost = orders.reduce((sum, o) => sum + (Number(o.cost) || 0), 0);
  const rows = orders
    .map(
      (o) => `
        <tr>
          <td>${escapeHtml(formatDate(o.createdAt))}</td>
          <td>${escapeHtml(o.barcode)}</td>
          <td>${escapeHtml(o.address)}</td>
          <td>${escapeHtml(o.fullName)} - ${escapeHtml(o.phone)}</td>
          <td>${escapeHtml(o.company)}</td>
          <td>${escapeHtml(o.cost)}</td>
        </tr>`
    )
    .join("");

  printWindow.document.write(`
    <html dir="rtl">
      <head>
        <title>طباعة الطلبات</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { text-align: center; margin-bottom: 10px; }
          .summary { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 8px; text-align: center; }
          th { background-color: #f0f0f0; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          th:first-child, td:first-child { min-width: 120px; }
        </style>
      </head>
      <body>
        <h2>جدول الطلبات</h2>
        <div class="summary">عدد الأوردرات: ${orders.length} | الإجمالي: ${totalCost}</div>
        <table>
          <thead>
            <tr><th>التاريخ</th><th>الباركود</th><th>العنوان</th><th>المرسل إليه</th><th>الشركة</th><th>المبلغ</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>`);
  printWindow.document.close();
  printWindow.print();
}
