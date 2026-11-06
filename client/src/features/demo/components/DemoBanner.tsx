import { MessageCircle } from "lucide-react";
import { useDemoInfo } from "../hooks/use-demo-info";
import { cn } from "@/lib/cn";

const WHATSAPP_TEXT = "مرحبًا، جرّبت النسخة التجريبية من مسار وأريد معرفة المزيد.";

// Shown on the login page and inside the demo company: data is shared and wiped on a schedule.
export function DemoBanner({ className }: { className?: string }) {
  const info = useDemoInfo();
  if (!info?.enabled) return null;
  return (
    <div role="note" className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 bg-tape px-4 py-2 text-center text-sm font-medium text-rail", className)}>
      <span>نسخة تجريبية — البيانات بتتمسح كل ساعة</span>
      {info.whatsapp && (
        <a
          href={`https://wa.me/${info.whatsapp}?text=${encodeURIComponent(WHATSAPP_TEXT)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-rail px-3 py-1 text-xs text-white hover:brightness-125"
        >
          <MessageCircle className="size-3.5" aria-hidden />
          تواصل معنا عبر واتساب
        </a>
      )}
    </div>
  );
}
