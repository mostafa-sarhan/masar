import { LayoutDashboard, Package, PackagePlus, ScanLine, HandCoins, Archive, BarChart3, Bike, Store, MapPinned, FileSpreadsheet, Users, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  // Extra words the command search matches.
  keywords?: string;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "التشغيل",
    items: [
      { to: "/", label: "لوحة اليوم", icon: LayoutDashboard, keywords: "الرئيسية dashboard" },
      { to: "/orders", label: "الشحنات", icon: Package, keywords: "orders طلبات بحث" },
      { to: "/orders/new", label: "شحنة جديدة", icon: PackagePlus, keywords: "إضافة new" },
      { to: "/orders/assign", label: "تسليم للمناديب", icon: ScanLine, keywords: "مسح باركود scan assign" },
      { to: "/orders/courier-batch", label: "تسوية المناديب", icon: HandCoins, keywords: "حفظ نتائج تسليم settlement" },
      { to: "/archive", label: "الأرشيف", icon: Archive, keywords: "archive" },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { to: "/reports", label: "التقارير", icon: BarChart3, adminOnly: true, keywords: "كشف حساب reports" },
      { to: "/couriers", label: "المناديب", icon: Bike, adminOnly: true, keywords: "couriers" },
      { to: "/merchants", label: "التجار", icon: Store, adminOnly: true, keywords: "merchants api" },
      { to: "/zones", label: "مناطق الشحن", icon: MapPinned, adminOnly: true, keywords: "zones أسعار محافظات مدن تسعير" },
      { to: "/import", label: "استيراد Excel", icon: FileSpreadsheet, adminOnly: true, keywords: "import اكسل" },
      { to: "/users", label: "المستخدمون والسجل", icon: Users, adminOnly: true, keywords: "users موظفين audit" },
      { to: "/settings", label: "الإعدادات", icon: Settings, adminOnly: true, keywords: "settings عمولات" },
    ],
  },
];
