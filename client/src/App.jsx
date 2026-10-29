import { Routes, Route } from "react-router-dom";
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
import ReportDelivery from "./ReportDelivery";
import Member from "./Member";
import Company from "./Company";
import Account from "./Account";
import Employee from "./Employee";
import Settings from "./Settings";
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
        <Route path="/reportdelivery" element={adminOnly(<ReportDelivery />)} />
        <Route path="/member" element={adminOnly(<Member />)} />
        <Route path="/company" element={adminOnly(<Company />)} />
        <Route path="/accounts" element={adminOnly(<Account />)} />
        <Route path="/employee" element={adminOnly(<Employee />)} />
        <Route path="/settings" element={adminOnly(<Settings />)} />
      </Route>
    </Routes>
  );
}

export default App;
