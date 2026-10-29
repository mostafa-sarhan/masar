// The hero's one memorable moment: a waybill that gets stamped "delivered" as the page opens.
const BARS = [3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 1];

export function HeroWaybill() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="absolute inset-x-6 -bottom-3 top-6 rotate-2 rounded-lg border border-rule bg-sheet-2" />
      <div className="manifest relative px-6 pb-6 pt-8 shadow-3">
        <div className="flex items-center justify-between border-b border-dashed border-rule pb-3">
          <span className="text-sm font-semibold text-ink">بوليصة شحن</span>
          <span className="num text-sm text-ink-3">48213907</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 py-4 text-sm">
          <div>
            <dt className="text-xs text-ink-3">المرسل</dt>
            <dd className="text-ink">متجر ليلى للأزياء</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">المستلم</dt>
            <dd className="text-ink">هالة سامي</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-ink-3">العنوان</dt>
            <dd className="text-ink">التجمع الخامس، شارع التسعين، عمارة 12</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">المندوب</dt>
            <dd className="text-ink">كريم عادل</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">المبلغ المطلوب</dt>
            <dd className="num font-semibold text-ink">1,250 ج.م</dd>
          </div>
        </dl>
        <div className="flex h-12 items-stretch gap-[2px] border-t border-dashed border-rule pt-3" dir="ltr">
          {BARS.map((w, i) => (
            <span key={i} className={i % 2 ? "bg-transparent" : "bg-ink"} style={{ width: w * 2 }} />
          ))}
        </div>
        <span className="hero-stamp stamp absolute bottom-4 end-6 text-2xl text-ok">تم التسليم</span>
      </div>
    </div>
  );
}
