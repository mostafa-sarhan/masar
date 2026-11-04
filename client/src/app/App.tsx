import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute, { FullPageLoading } from "./ProtectedRoute";
import StaffLayout from "./layouts/StaffLayout";
import { ADMIN_ROLES, STAFF_ROLES } from "@/lib/roles";

// Every page is its own chunk.
const LandingPage = lazy(() => import("@/features/marketing/pages/LandingPage"));
const NotFoundPage = lazy(() => import("@/features/marketing/pages/NotFoundPage"));
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
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
const ZonesPage = lazy(() => import("@/features/zones/pages/ZonesPage"));
const CourierAppPage = lazy(() => import("@/features/courier-app/pages/CourierAppPage"));
const MerchantPortalPage = lazy(() => import("@/features/merchant-portal/pages/MerchantPortalPage"));
const PlatformApp = lazy(() => import("@/features/platform/pages/PlatformApp"));
const TrackingPage = lazy(() => import("@/features/tracking/pages/TrackingPage"));

const adminOnly = (page: ReactNode) => <ProtectedRoute allow={ADMIN_ROLES}>{page}</ProtectedRoute>;
// Page-level fallback inside the shell keeps the navigation in place while a chunk loads.
const PageFallback = () => <div className="min-h-[60vh]" />;

// Old URLs keep working.
const LEGACY_REDIRECTS: Record<string, string> = {
  "/neworder": "/orders/new",
  "/adddelivery": "/orders/assign",
  "/alldelivery": "/orders/courier-batch",
  "/archife": "/archive",
  "/member": "/merchants",
  "/employee": "/users",
  "/reportdelivery": "/reports?tab=couriers",
  "/company": "/reports?tab=summary",
  "/accounts": "/reports?tab=statement",
};

export default function App() {
  return (
    <Suspense fallback={<FullPageLoading />}>
      <Routes>
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/platform/*" element={<PlatformApp />} />
        <Route path="/track" element={<TrackingPage />} />
        <Route path="/track/:trackingId" element={<TrackingPage />} />
        <Route path="/courier" element={<ProtectedRoute allow={["courier"]}><CourierAppPage /></ProtectedRoute>} />
        <Route path="/portal" element={<ProtectedRoute allow={["merchant"]}><MerchantPortalPage /></ProtectedRoute>} />
        {["/services", "/about", "/who"].map((p) => (
          <Route key={p} path={p} element={<Navigate to="/welcome" replace />} />
        ))}

        {/* Visitors who open the site root see the landing page. */}
        <Route element={<ProtectedRoute allow={STAFF_ROLES} guestRedirect="/welcome"><StaffLayout /></ProtectedRoute>}>
          <Route path="/" element={<Suspense fallback={<PageFallback />}><DashboardPage /></Suspense>} />
        </Route>
        <Route element={<ProtectedRoute allow={STAFF_ROLES}><StaffLayout /></ProtectedRoute>}>
          {[
            ["/orders", <OrdersPage />],
            ["/orders/new", <NewOrderPage />],
            ["/orders/assign", <AssignCourierPage />],
            ["/orders/courier-batch", <CourierBatchPage />],
            ["/archive", <ArchivePage />],
            ["/import", adminOnly(<ImportPage />)],
            ["/reports", adminOnly(<ReportsPage />)],
            ["/couriers", adminOnly(<CouriersPage />)],
            ["/merchants", adminOnly(<MerchantsPage />)],
            ["/users", adminOnly(<UsersPage />)],
            ["/settings", adminOnly(<SettingsPage />)],
            ["/zones", adminOnly(<ZonesPage />)],
          ].map(([path, element]) => (
            <Route key={path as string} path={path as string} element={<Suspense fallback={<PageFallback />}>{element}</Suspense>} />
          ))}
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
