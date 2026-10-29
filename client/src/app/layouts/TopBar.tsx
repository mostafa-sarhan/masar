import { useState, useEffect } from "react";
import Logo from "@/assets/logo.png";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/auth-context";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setOpen(false); // اقفل الموبايل menu بعد logout
  };

  // منع scroll لما الموبايل menu مفتوح
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const linkClass = "hover:bg-orange-500 px-2 rounded-lg text-lg font-semibold transition-colors";

  return (
    <>
      <nav className="bg-main text-white p-4 shadow-md relative z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Logo" className="w-[100px]" />
            {tenant && <span className="text-sm font-semibold">{tenant.name}</span>}
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6 items-center justify-around w-[60%]">
            <NavLink to="/" className={linkClass}>الرئيسية</NavLink>
            <NavLink to="/services" className={linkClass}>خدمتنا</NavLink>
            <NavLink to="/about" className={linkClass}>من نحن</NavLink>

            {!user ? (
              <Link to="/login" className="bg-white text-main px-4 py-1 rounded hover:bg-gray-200 font-semibold transition-colors">
                تسجيل الدخول
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="hover:bg-red-600 px-4 py-1 rounded font-semibold transition-colors cursor-pointer"
              >
                تسجيل الخروج
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-3xl cursor-pointer"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Fullscreen Menu */}
      {open && (
        <div className="fixed inset-0 bg-main z-[999] flex flex-col p-6">
          {/* Close Button */}
          <button
            className="self-end text-4xl text-white mb-10"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>

          {/* Menu Links */}
          <div className="flex flex-col text-white items-center gap-8 mt-10">
            <NavLink to="/" onClick={() => setOpen(false)} className="text-2xl font-bold p-2 rounded-lg">الرئيسية</NavLink>
            <NavLink to="/services" onClick={() => setOpen(false)} className="text-2xl font-bold p-2 rounded-lg">خدمتنا</NavLink>
            <NavLink to="/about" onClick={() => setOpen(false)} className="text-2xl font-bold p-2 rounded-lg">من نحن</NavLink>

            {!user ? (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="bg-white text-main px-6 py-2 rounded text-xl font-bold"
              >
                تسجيل الدخول
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="bg-red-600 px-6 py-2 rounded text-xl font-bold"
              >
                تسجيل الخروج
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
