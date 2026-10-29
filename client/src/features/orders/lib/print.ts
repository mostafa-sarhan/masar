import type { Order } from "@/lib/types";
import JsBarcode from "jsbarcode";
import { escapeHtml as esc } from "@/lib/html";
import { formatDate } from "@/lib/format-date";
import { statusLabel } from "@/lib/order-status";
import { formatMoney } from "@/lib/locale";
import { trackingUrl } from "@/features/orders/api/orders-api";

// Barcode as an SVG string, rendered in the main document so the print window needs no scripts.
// Printed orders: full staff orders or the courier sheet subset.
type Printable = Pick<Order, "barcode" | "fullName" | "address" | "phone" | "cost" | "createdAt"> & Partial<Pick<Order, "trackingId" | "merchant" | "status">>;

function barcodeSvg(value: string) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, String(value), { format: "code128", width: 2, height: 30, fontSize: 10, displayValue: true });
  return svg.outerHTML;
}

const BASE_CSS = `
  body { font-family: Arial, sans-serif; padding: 20px; }
  h2, h3 { text-align: center; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #333; padding: 6px; text-align: center; }
  th { background: #f0f0f0; }
  .label { width: 220px; border: 1px solid #333; padding: 8px; margin: 6px; display: inline-block; font-size: 12px; text-align: center; }
  .label p { margin: 2px 0; }
`;

// Opens one print window, prints, and closes it after printing.
function printDocument(title: string, body: string) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(
    `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${BASE_CSS}</style></head><body>${body}</body></html>`
  );
  win.document.close();
  win.addEventListener("afterprint", () => win.close());
  win.focus();
  win.print();
}

const labelHtml = (o: Printable) => `
  <div class="label">
    ${barcodeSvg(o.barcode)}
    <p><strong>الاسم:</strong> ${esc(o.fullName)}</p>
    <p><strong>العنوان:</strong> ${esc(o.address)}</p>
    <p><strong>رقم الهاتف:</strong> ${esc(o.phone)}</p>
    <p><strong>التكلفة:</strong> ${esc(formatMoney(o.cost))}</p>
    ${o.trackingId ? `<p style="font-size:10px"><strong>تتبع:</strong> <span dir="ltr">${esc(o.trackingId)}</span><br><span dir="ltr">${esc(trackingUrl(o.trackingId))}</span></p>` : ""}
  </div>`;

export const printLabel = (order: Printable) => printDocument("ملصق شحنة", labelHtml(order));
export const printLabels = (orders: Printable[]) => printDocument("ملصقات الشحنات", orders.map(labelHtml).join(""));

const total = (orders: Printable[]) => orders.reduce((sum, o) => sum + (Number(o.cost) || 0), 0);

// Courier hand-over sheet with barcodes.
export function printCourierSheet(orders: Printable[], courierName: string) {
  const rows = orders
    .map(
      (o) => `<tr>
        <td>${esc(formatDate(o.createdAt))}</td><td>${barcodeSvg(o.barcode)}</td><td>${esc(o.address)}</td>
        <td>${esc(o.fullName)}<br>${esc(o.phone)}</td><td>${esc(o.merchant?.name ?? "-")}</td><td>${esc(o.cost)}</td>
      </tr>`
    )
    .join("");
  printDocument(
    "تسليم المندوب",
    `<h2>المندوب: ${esc(courierName)}</h2>
     <h3>عدد الأوردرات: ${orders.length} - المجموع: ${total(orders)}</h3>
     <table><thead><tr><th>التاريخ</th><th>الباركود</th><th>العنوان</th><th>المرسل إليه</th><th>الشركة</th><th>المبلغ</th></tr></thead>
     <tbody>${rows}</tbody></table>`
  );
}

export function printOrdersTable(orders: Printable[]) {
  const rows = orders
    .map(
      (o) => `<tr>
        <td>${esc(formatDate(o.createdAt))}</td><td>${esc(o.barcode)}</td><td>${esc(o.address)}</td>
        <td>${esc(o.fullName)} - ${esc(o.phone)}</td><td>${esc(o.merchant?.name ?? "-")}</td>
        <td>${esc(o.status ? statusLabel(o.status) : "")}</td><td>${esc(o.cost)}</td>
      </tr>`
    )
    .join("");
  printDocument(
    "طباعة الطلبات",
    `<h2>جدول الطلبات</h2>
     <h3>عدد الأوردرات: ${orders.length} | الإجمالي: ${total(orders)}</h3>
     <table><thead><tr><th>التاريخ</th><th>الباركود</th><th>العنوان</th><th>المرسل إليه</th><th>الشركة</th><th>الحالة</th><th>المبلغ</th></tr></thead>
     <tbody>${rows}</tbody></table>`
  );
}
