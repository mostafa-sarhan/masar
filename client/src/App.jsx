import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "./MainLayout";
import Dashboard from "./dashboards/Dashboard";
import Services from "./Services";
import Who from "./Who";
import Neworder from "./Neworder";
import Orders from "./Orders";
import Adddelivery from "./Adddelivery";
import Alldelivery from "./Alldelivery";
import Archive from "./Archive";
import Member from "./Member";
import Employee from "./Employee";
import Settings from "./Settings";
import Reports from "./Reports";
import Couriers from "./Couriers";
import ImportOrders from "./ImportOrders";
import PlatformApp from "./platform/PlatformApp";
import { ADMIN_ROLES, STAFF_ROLES } from "./utils/roles";
import CourierApp from "./CourierApp";
import MerchantPortal from "./MerchantPortal";
import TrackingPage from "./TrackingPage";

const adminOnly = (page) => <ProtectedRoute allow={ADMIN_ROLES}>{page}</ProtectedRoute>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/platform/*" element={<PlatformApp />} />
      <Route path="/track" element={<TrackingPage />} />
      <Route path="/track/:trackingId" element={<TrackingPage />} />
      <Route path="/courier" element={<ProtectedRoute allow={["courier"]}><CourierApp /></ProtectedRoute>} />
      <Route path="/portal" element={<ProtectedRoute allow={["merchant"]}><MerchantPortal /></ProtectedRoute>} />

      <Route
        element={
          <ProtectedRoute allow={STAFF_ROLES}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/services" element={<Services />} />
        <Route path="/who" element={<Who />} />
        <Route path="/neworder" element={<Neworder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/adddelivery" element={<Adddelivery />} />
        <Route path="/alldelivery" element={<Alldelivery />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/reports" element={adminOnly(<Reports />)} />
        <Route path="/couriers" element={adminOnly(<Couriers />)} />
        <Route path="/import" element={<ImportOrders />} />
        {/* Old report pages now live under Reports */}
        <Route path="/reportdelivery" element={<Navigate to="/reports?tab=couriers" replace />} />
        <Route path="/member" element={adminOnly(<Member />)} />
        <Route path="/company" element={<Navigate to="/reports?tab=summary" replace />} />
        <Route path="/accounts" element={<Navigate to="/reports?tab=statement" replace />} />
        <Route path="/employee" element={adminOnly(<Employee />)} />
        <Route path="/settings" element={adminOnly(<Settings />)} />
      </Route>
    </Routes>
  );
}

export default App;
