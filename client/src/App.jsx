// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 🔐 Context
import { AuthProvider } from "./context/AuthContext";

// Layout
import DashboardLayout from "./layout/DashboardLayout";

// Role-based routing
import RoleRoute from "./components/RoleRoute";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Company pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyProducts from "./pages/company/CompanyProducts";
import CompanyDrivers from "./pages/company/CompanyDrivers";
import CompanyCustomers from "./pages/company/CompanyCustomers";
import CompanyTrips from "./pages/company/CompanyTrips";

// Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerTrips from "./pages/manager/ManagerTrips";
import ManagerDrivers from "./pages/manager/ManagerDrivers";
import ManagerCustomers from "./pages/manager/ManagerCustomers";
import ManagerProducts from "./pages/manager/ManagerProducts";
import ManagerVehicles from "./pages/manager/ManagerVehicles";
import ManagerOrders from "./pages/manager/ManagerOrders";
import ManagerPayments from "./pages/manager/ManagerPayments";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ==============================
              SUPERADMIN / SYSTEM OWNER
              ============================== */}
          <Route
            path="/admin"
            element={
              <RoleRoute roles={["superadmin"]}>
                <DashboardLayout role="admin" />
              </RoleRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
          </Route>


          {/* ==============================
              COMPANY DASHBOARD
              ============================== */}
          <Route
            path="/company"
            element={
              <RoleRoute roles={["company"]}>
                <DashboardLayout role="company" />
              </RoleRoute>
            }
          >
            <Route index element={<CompanyDashboard />} />
            <Route path="products" element={<CompanyProducts />} />
            <Route path="drivers" element={<CompanyDrivers />} />
            <Route path="customers" element={<CompanyCustomers />} />
            <Route path="trips" element={<CompanyTrips />} />
            <Route path="orders" element={<ManagerOrders />} />
            <Route path="vehicles" element={<ManagerVehicles />} />
            <Route path="payments" element={<ManagerPayments />} />
          </Route>


          {/* ==============================
              MANAGER DASHBOARD
              ============================== */}
          <Route
            path="/manager"
            element={
              <RoleRoute roles={["manager"]}>
                <DashboardLayout role="manager" />
              </RoleRoute>
            }
          >
            <Route index element={<ManagerDashboard />} />
            <Route path="drivers" element={<ManagerDrivers />} />
            <Route path="vehicles" element={<ManagerVehicles />} />
            <Route path="customers" element={<ManagerCustomers />} />
            <Route path="products" element={<ManagerProducts />} />
            <Route path="orders" element={<ManagerOrders />} />
            <Route path="trips" element={<ManagerTrips />} />
            <Route path="payments" element={<ManagerPayments />} />
          </Route>


          {/* ==============================
              DEFAULT REDIRECT
              ============================== */}
          <Route path="*" element={<Navigate to="/manager" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
