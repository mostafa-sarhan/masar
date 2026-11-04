import Money from "@/components/ui/Money";
import type { ShippingQuote } from "@/lib/types";

// "سعر الشحن 45 ج.م (القاهرة الكبرى)" under the destination fields.
export function ShippingQuoteNote({ quote, loading, governorate }: { quote: Pick<ShippingQuote, "zoneName" | "shippingFee"> | null; loading: boolean; governorate: string }) {
  if (!governorate) return <span>اختر المحافظة والمدينة لحساب سعر الشحن.</span>;
  if (loading) return <span>جارٍ حساب سعر الشحن…</span>;
  if (!quote || quote.shippingFee === null) return <span>لا توجد منطقة شحن لهذا المكان؛ تُطبق عمولة الشركة الثابتة.</span>;
  return (
    <span>
      سعر الشحن <b className="text-ink"><Money value={quote.shippingFee} /></b> ({quote.zoneName})
    </span>
  );
}
