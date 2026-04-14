import Navbar from "./Navbar";
import Right from "./Right";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="w-full h-screen flex flex-col text-center">

      {/* Navbar */}
      <div className="bg-main h-[70px] shrink-0">
        <Navbar />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-hidden relative grid grid-cols-12 gap-4 h-full">

        {/* Right Sidebar (Desktop only) */}
        <div className="hidden md:block col-span-3 bg-main rounded-2xl overflow-y-auto h-full">
          <Right />
        </div>

        {/* Page Content */}
        <div className="col-span-12 md:col-span-9 bg-main rounded-2xl overflow-y-auto text-white h-full p-4 relative">

          {/* Mobile Sidebar Button */}
          <button
            className="md:hidden bg-purple-600 text-white px-4 py-2 rounded mb-4 fixed top-[80px] right-4 z-40"
            onClick={() => setSidebarOpen(true)}
          >
            عرض القائمة
          </button>

          <Outlet />
        </div>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
            <div className="bg-main w-full h-full p-2 overflow-y-auto shadow-xl absolute right-0 top-0">
              <button
                className="text-white text-3xl mb-4"
                onClick={() => setSidebarOpen(false)}
              >
                ✕
              </button>
              {/* Pass setSidebarOpen to Right */}
              <Right closeSidebar={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
