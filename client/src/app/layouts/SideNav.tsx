import { NavLink } from "react-router-dom";
import { useAuth } from "@/app/auth-context";
import { isAdmin } from "@/lib/roles";

export default function SideNav({ closeSidebar }: { closeSidebar?(): void } = {}) {
  void closeSidebar;
  const { user } = useAuth();

  return (
    <div className="py-8 flex flex-col items-center justify-center space-y-4  ">

      {/* العناصر المشتركه بين الادمن والموظف */}
      <NavLink to="/orders/new" className="bg-white w-[85%] text-3xl p-2 rounded">
        إضافة شحنة جديد
      </NavLink>
      <NavLink to="/orders" className="bg-white w-[85%] text-3xl p-2 rounded">
        قائمة الشحنات
      </NavLink>
      <NavLink to="/orders/assign" className="bg-white w-[85%] text-3xl p-2 rounded">
        إضافة الشحنات للمندوب
      </NavLink>
      <NavLink to="/orders/courier-batch" className="bg-white w-[85%] text-3xl p-2 rounded">
        قائمة المناديب
      </NavLink>
      <NavLink to="/archive" className="bg-white w-[85%] text-3xl p-2 rounded">
        الأرشيف
      </NavLink>

      {/* العناصر الخاصة بالأدمن فقط */}
      {isAdmin(user?.role) && (
        <>
          <NavLink to="/import" className="bg-white w-[85%] text-3xl p-2 rounded">
            استيراد Excel
          </NavLink>
          <NavLink to="/reports" className="bg-white w-[85%] text-3xl p-2 rounded">
            التقارير
          </NavLink>
          <NavLink to="/couriers" className="bg-white w-[85%] text-3xl p-2 rounded">
            المناديب
          </NavLink>
          <NavLink to="/merchants" className="bg-white w-[85%] text-3xl p-2 rounded">
            التجار
          </NavLink>
          <NavLink to="/users" className="bg-white w-[85%] text-3xl p-2 rounded">
            الموظفون
          </NavLink>
          <NavLink to="/settings" className="bg-white w-[85%] text-3xl p-2 rounded">
            الإعدادات
          </NavLink>
        </>
      )}
    </div>
  );
}
