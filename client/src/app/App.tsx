import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "@/styles/app.css";
import ProtectedRoute from "./ProtectedRoute";
import StaffLayout from "./layouts/StaffLayout";
import { ADMIN_ROLES, STAFF_ROLES } from "@/lib/roles";

// Every page is its own chunk.
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const ServicesPage = lazy(() => import("@/features/marketing/pages/ServicesPage"));
const AboutPage = lazy(() => import("@/features/marketing/pages/AboutPage"));
const OrdersPage = lazy(() => import("@/features/orders/pages/OrdersPage"));
const NewOrderPage = lazy(() => import("@/features/orders/pages/NewOrderPage"));
const AssignCourierPage = lazy(() => import("@/features/orders/pages/AssignCourierPage"));
const CourierBatchPage = lazy(() => import("@/features/orders/pages/CourierBatchPage"));
const ArchivePage = lazy(() => import("@/features/orders/pages/ArchivePage"));
const ImportPage = lazy(() => import("@/features/import/pages/ImportPage"));
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage"));
const CouriersPage = lazy(() => import("@/features/couriers/pages/CouriersPage"));
const MerchantsPage = lazy(() => import("@/features/merchants/pages/MerchantsPage"));
const UsersPage = lazy(() => import("@/features/users/pages/UsersPage"));
const SettingsPage = lazy(() => import("@/features/settings/pages/SettingsPage"));
const CourierAppPage = lazy(() => import("@/features/courier-app/pages/CourierAppPage"));
const MerchantPortalPage = lazy(() => import("@/features/merchant-portal/pages/MerchantPortalPage"));
const PlatformApp = lazy(() => import("@/features/platform/pages/PlatformApp"));
const TrackingPage = lazy(() => import("@/features/tracking/pages/TrackingPage"));

const adminOnly = (page: ReactNode) => <ProtectedRoute allow={ADMIN_ROLES}>{page}</ProtectedRoute>;

// Old URLs (before the restructure) keep working.
const LEGACY_REDIRECTS: Record<string, string> = {
  "/neworder": "/orders/new",
  "/adddelivery": "/orders/assign",
  "/alldelivery": "/orders/courier-batch",
  "/archife": "/archive",
  "/member": "/merchants",
  "/employee": "/users",
  "/who": "/about",
  "/reportdelivery": "/reports?tab=couriers",
  "/company": "/reports?tab=summary",
  "/accounts": "/reports?tab=statement",
};

export default function App() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-main" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/platform/*" element={<PlatformApp />} />
        <Route path="/track" element={<TrackingPage />} />
        <Route path="/track/:trackingId" element={<TrackingPage />} />
        <Route path="/courier" element={<ProtectedRoute allow={["courier"]}><CourierAppPage /></ProtectedRoute>} />
        <Route path="/portal" element={<ProtectedRoute allow={["merchant"]}><MerchantPortalPage /></ProtectedRoute>} />

        <Route element={<ProtectedRoute allow={STAFF_ROLES}><StaffLayout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/new" element={<NewOrderPage />} />
          <Route path="/orders/assign" element={<AssignCourierPage />} />
          <Route path="/orders/courier-batch" element={<CourierBatchPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/import" element={adminOnly(<ImportPage />)} />
          <Route path="/reports" element={adminOnly(<ReportsPage />)} />
          <Route path="/couriers" element={adminOnly(<CouriersPage />)} />
          <Route path="/merchants" element={adminOnly(<MerchantsPage />)} />
          <Route path="/users" element={adminOnly(<UsersPage />)} />
          <Route path="/settings" element={adminOnly(<SettingsPage />)} />
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
        </Route>
      </Routes>
    </Suspense>
  );
}
