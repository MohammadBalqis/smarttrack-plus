// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 🔐 Context
import { AuthProvider } from "./context/AuthContext";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Role-based routing
import RoleRoute from "./components/RoleRoute";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Company pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyProducts from "./pages/company/CompanyProducts";
import CompanyDrivers from "./pages/company/CompanyDrivers";
import CompanyCustomers from "./pages/company/CompanyCustomers"; // we will create this soon

// Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerTrips from "./pages/manager/ManagerTrips";
import ManagerDrivers from "./pages/manager/ManagerDrivers";
import ManagerCustomers from "./pages/manager/ManagerCustomers";
import ManagerVehicles from "./pages/manager/ManagerVehicles";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* SYSTEM OWNER / SUPERADMIN */}
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

          {/* COMPANY (company + manager can share this if you want) */}
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
            <Route path="trips" element={<CompanyTrips />} />
            <Route path="customers" element={<ManagerCustomers />} />   {/* SAME PAGE */}
          </Route>

          {/* MANAGER DASHBOARD */}
          <Route
            path="/manager"
            element={
              <RoleRoute roles={["manager"]}>
                <DashboardLayout role="manager" />
              </RoleRoute>
            }
          >
            <Route index element={<ManagerDashboard />} />
          </Route>

          {/* DEFAULT */}
          <Route path="*" element={<Navigate to="/company" />} />
          <Route path="trips" element={<ManagerTrips />} />
          <Route path="drivers" element={<ManagerDrivers />} /> {/* 👈 NEW */}
          <Route path="customers" element={<ManagerCustomers />} />   {/* NEW */}
          <Route path="products" element={<ManagerProducts />} />
          <Route path="vehicles" element={<ManagerVehicles />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
