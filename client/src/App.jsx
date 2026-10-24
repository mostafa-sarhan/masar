import { Routes, Route } from "react-router-dom";
import "./App.css";

import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "./MainLayout";
import Dashbord from "./dashboards/Dashbord";
import Services from "./Services";
import Who from "./Who";
import Neworder from "./Neworder";
import Orders from "./Orders";
import Adddelivery from "./Adddelivery";
import Alldelivery from "./Alldelivery";
import Archife from "./Archife";
import ReportDelivery from "./ReportDelivery";
import Member from "./Member";
import Company from "./Company";
import Account from "./Account";
import Employee from "./Employee";

const adminOnly = (page) => <ProtectedRoute allow={["admin"]}>{page}</ProtectedRoute>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute allow={["admin", "employee"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashbord />} />
        <Route path="/services" element={<Services />} />
        <Route path="/who" element={<Who />} />
        <Route path="/neworder" element={<Neworder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/adddelivery" element={<Adddelivery />} />
        <Route path="/alldelivery" element={<Alldelivery />} />
        <Route path="/archife" element={<Archife />} />
        <Route path="/reportdelivery" element={adminOnly(<ReportDelivery />)} />
        <Route path="/member" element={adminOnly(<Member />)} />
        <Route path="/company" element={adminOnly(<Company />)} />
        <Route path="/accounts" element={adminOnly(<Account />)} />
        <Route path="/employee" element={adminOnly(<Employee />)} />
      </Route>
    </Routes>
  );
}

export default App;
