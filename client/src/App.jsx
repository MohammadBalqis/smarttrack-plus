// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./layout/DashboardLayout";
import RoleRoute from "./components/RoleRoute";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";

// Company pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyProducts from "./pages/company/CompanyProducts";
import CompanyDrivers from "./pages/company/CompanyDrivers";
import CompanyCustomers from "./pages/company/CompanyCustomers";
import CompanyTrips from "./pages/company/CompanyTrips";
import CompanyOrders from "./pages/company/CompanyOrders";
import CompanyVehicles from "./pages/company/CompanyVehicles";
import CompanyPayments from "./pages/company/CompanyPayments";

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
              SUPERADMIN
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
              COMPANY
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
            <Route path="orders" element={<CompanyOrders />} />
            <Route path="vehicles" element={<CompanyVehicles />} />
            <Route path="payments" element={<CompanyPayments />} />
          </Route>

          {/* ==============================
              MANAGER
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

          {/* DEFAULT */}
          <Route path="*" element={<Navigate to="/manager" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
