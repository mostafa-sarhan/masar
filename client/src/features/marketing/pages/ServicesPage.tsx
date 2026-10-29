import { Link } from "react-router-dom";

export default function Services() {
  const services = [
    {
      title: "شحن سريع",
      desc: "توصيل الشحنات في أسرع وقت ممكن داخل جميع المحافظات.",
      icon: "🚚",
      color: "bg-blue-100",
    },
    {
      title: "تحصيل نقدي",
      desc: "تحصيل المبالغ من العملاء وتسليمها للتاجر بكل أمان.",
      icon: "💰",
      color: "bg-green-100",
    },
    {
      title: "تتبع الشحنات",
      desc: "متابعة حالة الشحنة لحظة بلحظة بسهولة.",
      icon: "📦",
      color: "bg-purple-100",
    },
    {
      title: "إدارة المناديب",
      desc: "تنظيم وتوزيع الشحنات على المناديب بكفاءة.",
      icon: "👨‍✈️",
      color: "bg-yellow-100",
    },
    {
      title: "تقارير مالية",
      desc: "تقارير مفصلة عن الحسابات والتحصيلات.",
      icon: "📊",
      color: "bg-red-100",
    },
    {
      title: "دعم فني",
      desc: "فريق دعم جاهز لمساعدتك في أي وقت.",
      icon: "☎️",
      color: "bg-indigo-100",
    },
  ];

  return (
    <div className="  py-6">
      <div className="w-[95%] m-auto">

        {/* ===== Header ===== */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-3">
            خدماتنا
          </h1>
          <p className="text-white max-w-xl mx-auto">
            نوفر لك حلول شحن متكاملة تساعدك على إدارة شحناتك بسهولة واحترافية
          </p>
        </div>

        {/* ===== Services Grid ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition"
            >
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-full text-2xl mb-4 ${service.color}`}
              >
                {service.icon}
              </div>

              <h3 className="text-xl font-semibold text-black mb-2">
                {service.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {service.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ===== CTA ===== */}
        <div className="mt-16 bg-orange-500 text-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">
            جاهز تبدأ شغلك معانا؟
          </h2>
          <p className="mb-6">
            أضف شحنتك الآن واستمتع بتجربة شحن احترافية
          </p>
          <div className="bg-white text-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            <Link to="/orders/new">اضافة شحنه جديده </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
