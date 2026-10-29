
export default function Who() {
  return (
    <div className=" py-16 px-4">

      {/* Container */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-10">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            من نحن
          </h1>
          <div className="w-24 h-1 bg-orange-500 mx-auto rounded-full"></div>
        </div>

        {/* About Company */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">
            FAST Express
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            FAST Express هي منصة متكاملة لتقديم حلول ذكية لشركات الشحن،
            تهدف إلى تسهيل وإدارة جميع مراحل عملية الشحن بكفاءة واحترافية عالية.
          </p>

          <p className="text-gray-600 leading-relaxed">
            نوفر نظامًا شاملاً يساعد شركات الشحن على متابعة الطلبات،
            إدارة المندوبين، تتبع الشحنات، وتحليل الأداء،
            مما يساهم في تحسين جودة الخدمة وزيادة رضا العملاء.
          </p>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Services Summary */}
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-xl bg-gray-50">
            <h3 className="font-bold text-gray-800 mb-2">إدارة الشحنات</h3>
            <p className="text-gray-600 text-sm">
              متابعة كاملة لحالة الشحنات من الإنشاء حتى التسليم.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50">
            <h3 className="font-bold text-gray-800 mb-2">لوحات تحكم ذكية</h3>
            <p className="text-gray-600 text-sm">
              إحصائيات وتقارير دقيقة لمساعدتك في اتخاذ القرار.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50">
            <h3 className="font-bold text-gray-800 mb-2">تنظيم العمل</h3>
            <p className="text-gray-600 text-sm">
              تسهيل التواصل بين الإدارة والمندوبين والعملاء.
            </p>
          </div>
        </div>

        {/* Designer Section */}
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            تصميم وتنفيذ
          </h3>
          <p className="text-gray-700 leading-relaxed">
            تم تصميم هذه المنصة بواسطة
            <span className="font-semibold text-orange-600">
              {" "}مهندس مصطفى سرحان{" "}
            </span>
            ،
            بخبرة أكثر من سنتين في تصميم وتطوير مواقع الويب
            والأنظمة الإدارية باستخدام أحدث التقنيات.
          </p>
        </div>

      </div>
    </div>
  );
}
