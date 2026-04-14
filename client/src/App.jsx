import { Routes, Route } from "react-router-dom";
import "./App.css";
import "./index.css"

// Layout parts
import Navbar from "./Navbar";
import Right from "./Right";

// Pages
import Login from "./Login";
import Left from "./Left";
import Neworder from "./Neworder";
import Orders from "./Orders";
import Adddelivery from "./Adddelivery";
import Alldelivery from "./Alldelivery";
import Archife from "./Archife";
import ReportDelivery from "./ReportDelivery";
import Orderrefused from "./Member";
import Ordernotresponse from "./Company";
import Account from "./Account";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "./MainLayout";
import Dashbord from "./dashboards/Dashbord";
import Services from "./Services";
import Who from "./Who";
import Member from "./Member";
import Company from "./Company";
import Employee from "./Employee";





function App() {
  return (
    <Routes>
      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Protected System Layout */}
      <Route
        element={
          <ProtectedRoute allow={["admin", "employee"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashbord />} />
        <Route path="/services" element={<Services/>} />
        <Route path="/who" element={<Who/>} />
        <Route path="/neworder" element={<Neworder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/adddelivery" element={<Adddelivery />} />
        <Route path="/alldelivery" element={<Alldelivery />} />
        <Route path="/archife" element={<Archife />} />
        <Route path="/reportdelivery" element={<ReportDelivery />} />
        <Route path="/member" element={<Member />} />
        <Route path="/company" element={<Company />} />
        <Route path="/accounts" element={<Account />} />
        <Route path="/employee" element={<Employee />} />
      </Route>
    </Routes>
  );
}

export default App;
