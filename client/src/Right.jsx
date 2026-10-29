import { NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { isAdmin } from "./utils/roles";

export default function Right() {
  const { user } = useAuth();

  return (
    <div className="py-8 flex flex-col items-center justify-center space-y-4  ">

      {/* العناصر المشتركه بين الادمن والموظف */}
      <NavLink to="/neworder" className="bg-white w-[85%] text-3xl p-2 rounded">
        إضافة شحنة جديد
      </NavLink>
      <NavLink to="/orders" className="bg-white w-[85%] text-3xl p-2 rounded">
        قائمة الشحنات
      </NavLink>
      <NavLink to="/adddelivery" className="bg-white w-[85%] text-3xl p-2 rounded">
        إضافة الشحنات للمندوب
      </NavLink>
      <NavLink to="/alldelivery" className="bg-white w-[85%] text-3xl p-2 rounded">
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
          <NavLink to="/member" className="bg-white w-[85%] text-3xl p-2 rounded">
            التجار
          </NavLink>
          <NavLink to="/employee" className="bg-white w-[85%] text-3xl p-2 rounded">
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
