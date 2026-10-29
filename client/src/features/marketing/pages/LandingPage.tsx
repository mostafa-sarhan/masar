import { Link } from "react-router-dom";
import { PLAN_LIMITS, TRIAL_DAYS, type Plan } from "@masar/shared";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { HeroWaybill } from "../components/HeroWaybill";
import { AccessRequestForm } from "../components/AccessRequestForm";
import { cn } from "@/lib/cn";

const DEMO_URL = import.meta.env.VITE_DEMO_URL as string | undefined;

const ROLES = [
  {
    role: "فريق المكتب",
    lines: ["إدخال الشحنات يدويًا أو من ملف Excel أو من نظام التاجر مباشرة", "تسليم الشحنات للمندوب بمسح الباركود وطباعة كشفه", "متابعة كل شحنة بسجل كامل لتغيّر حالتها"],
  },
  {
    role: "المندوب",
    lines: ["شحناته المفتوحة على هاتفه مع زر الاتصال والخريطة", "تسجيل التسليم أو المرتجع أو الرفض بلمسة، مع السبب", "النقدية المطلوب تسليمها للمكتب محسوبة أولًا بأول"],
  },
  {
    role: "التاجر",
    lines: ["بوابة يرى فيها شحناته وحالتها لحظة بلحظة", "كشف حساب بصافي مستحقاته بعد مصاريف الشحن", "ربط متجره عبر API برقم طلبه الخاص دون تكرار"],
  },
  {
    role: "صاحب الشركة",
    lines: ["تقارير التجار والمناديب والتسويات من نفس البيانات", "تحديد العمولات وما يُخصم من التاجر لكل شركة", "صلاحيات للفريق وسجل بكل إجراء ومن قام به"],
  },
];

const STEPS = [
  { title: "تصل الشحنة", text: "من التاجر عبر البوابة أو API، أو يُدخلها المكتب، أو تُستورد من Excel." },
  { title: "تخرج مع المندوب", text: "يُمسح الباركود ويُطبع كشف المندوب، وتتحول الحالة إلى «مع المندوب»." },
  { title: "يسجّل المندوب النتيجة", text: "تسليم أو مرتجع أو رفض، فيرى المكتب والتاجر والعميل الحالة فورًا." },
  { title: "تُسوّى الحسابات", text: "تُحفظ العمولات على كل شحنة مسلّمة، ويخرج كشف التاجر جاهزًا." },
];

const PLANS: { plan: Plan; name: string; note: string }[] = [
  { plan: "trial", name: "تجريبية", note: `${TRIAL_DAYS} يومًا لتجربة النظام على شحناتك الحقيقية` },
  { plan: "starter", name: "أساسية", note: "لشركة شحن في بداية نموها" },
  { plan: "pro", name: "احترافية", note: "للشركات ذات الفروع والحجم الكبير" },
];

const count = (n: number | null, unit: string) => (n === null ? `${unit} بلا حد` : `${n.toLocaleString("en")} ${unit}`);

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-rule/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Logo className="text-ink" />
          <nav aria-label="أقسام الصفحة" className="hidden gap-6 text-sm text-ink-2 md:flex">
            <a href="#roles" className="hover:text-ink">لمن</a>
            <a href="#how" className="hover:text-ink">كيف يعمل</a>
            <a href="#plans" className="hover:text-ink">الباقات</a>
            <a href="#demo" className="hover:text-ink">جرّب العرض</a>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <ThemeToggle className="hidden text-ink-2 sm:inline-flex" />
            <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-sheet-2">تسجيل الدخول</Link>
            <a href="#request" className="hidden rounded-md bg-carbon px-4 py-2 text-sm font-medium text-carbon-ink hover:brightness-110 sm:inline-block">اطلب حسابًا</a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 overflow-x-clip px-4 pb-20 pt-14 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.25] text-ink sm:text-5xl">كل شحنة في شركتك، من المخزن إلى باب العميل، على مسار واضح.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              مسار نظام لشركات الشحن يجمع المكتب والمناديب والتجار على نفس البيانات: الشحنات، التسليم، المرتجعات، وكشوف الحساب.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#request" className="inline-flex h-12 items-center rounded-md bg-carbon px-6 font-medium text-carbon-ink shadow-1 hover:brightness-110">اطلب حسابًا لشركتك</a>
              <a href="#demo" className="inline-flex h-12 items-center rounded-md border border-rule bg-sheet px-6 font-medium text-ink hover:bg-sheet-2">جرّب العرض المباشر</a>
            </div>
            <p className="mt-5 text-sm text-ink-3">تبدأ بفترة تجريبية {TRIAL_DAYS} يومًا، بلا بطاقة دفع.</p>
          </div>
          <HeroWaybill />
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-20 border-t border-rule bg-sheet">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="max-w-2xl text-3xl font-semibold leading-snug text-ink">شاشة لكل من يلمس الشحنة</h2>
            <p className="mt-3 max-w-2xl text-ink-2">كل دور يرى ما يخصه فقط، وكل شركة معزولة تمامًا عن غيرها.</p>
            <dl className="mt-12 divide-y divide-rule border-y border-rule">
              {ROLES.map((r) => (
                <div key={r.role} className="grid gap-3 py-7 md:grid-cols-[14rem_1fr]">
                  <dt className="text-xl font-semibold text-ink">{r.role}</dt>
                  <dd>
                    <ul className="grid gap-x-8 gap-y-2 text-ink-2 sm:grid-cols-3">
                      {r.lines.map((l) => (
                        <li key={l} className="leading-relaxed">{l}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works: a real sequence, drawn as the route a shipment travels. */}
        <section id="how" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-3xl font-semibold text-ink">رحلة الشحنة في مسار</h2>
            <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
              <span aria-hidden className="absolute inset-x-4 top-5 hidden border-t-2 border-dashed border-carbon/40 md:block" />
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative">
                  <span className="relative grid size-10 place-items-center rounded-full border-2 border-carbon bg-paper font-semibold text-carbon num">{i + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-2">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Plans (no prices yet) */}
        <section id="plans" className="scroll-mt-20 border-t border-rule bg-sheet">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-3xl font-semibold text-ink">الباقات</h2>
            <p className="mt-3 max-w-2xl text-ink-2">كل الباقات فيها كل الشاشات والتقارير. الفرق في عدد المستخدمين والشحنات الشهرية. تواصل معنا لمعرفة الأسعار.</p>
            <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule md:grid-cols-3">
              {PLANS.map(({ plan, name, note }) => (
                <div key={plan} className={cn("bg-paper p-7", plan === "starter" && "bg-sheet-2")}>
                  <h3 className="text-xl font-semibold text-ink">{name}</h3>
                  <p className="mt-1 text-sm text-ink-2">{note}</p>
                  <ul className="mt-6 space-y-2 text-ink">
                    <li>{count(PLAN_LIMITS[plan].maxUsers, "مستخدم")}</li>
                    <li>{count(PLAN_LIMITS[plan].maxOrdersPerMonth, "شحنة شهريًا")}</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live demo */}
        <section id="demo" className="scroll-mt-20 bg-rail text-rail-ink">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-white">جرّب العرض المباشر</h2>
              <p className="mt-4 max-w-xl leading-relaxed">
                شركة شحن تجريبية ببيانات جاهزة: شحنات بكل الحالات، مناديب، تجار، وتقارير. ادخل كصاحب شركة أو موظف أو مندوب أو تاجر، وتُعاد البيانات إلى حالتها الأولى تلقائيًا.
              </p>
            </div>
            <div className="md:justify-self-end">
              {DEMO_URL ? (
                <a href={DEMO_URL} className="inline-flex h-12 items-center rounded-md bg-tape px-6 font-semibold text-rail hover:brightness-105">افتح العرض التجريبي</a>
              ) : (
                <p className="rounded-md border border-white/20 px-5 py-4 text-sm">العرض المباشر يُتاح قريبًا. اطلب حسابًا تجريبيًا لشركتك في الأسفل.</p>
              )}
            </div>
          </div>
        </section>

        {/* Request access */}
        <section id="request" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="text-3xl font-semibold text-ink">اطلب حسابًا لشركتك</h2>
              <p className="mt-3 leading-relaxed text-ink-2">نراجع الطلب ونجهّز حساب شركتك بالباقة التجريبية، ثم نرسل بيانات الدخول لصاحب الشركة.</p>
            </div>
            <div className="manifest px-6 pb-6 pt-8 shadow-2">
              <AccessRequestForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-8 text-sm text-ink-2">
          <Logo className="text-ink" />
          <Link to="/track" className="hover:text-ink">تتبع شحنة</Link>
          <Link to="/login" className="hover:text-ink">تسجيل الدخول</Link>
          <span className="ms-auto text-ink-3">© {new Date().getFullYear()} مسار</span>
        </div>
      </footer>
    </div>
  );
}
