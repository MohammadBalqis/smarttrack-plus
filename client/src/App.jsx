// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import RoleRoute from "./components/RoleRoute";

// Layouts
import AdminLayout from "./layout/AdminLayout";
import CompanyLayout from "./layout/CompanyLayout";
import ManagerLayout from "./layout/ManagerLayout";
import CustomerLayout from "./layout/CustomerLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Company Pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyProducts from "./pages/company/CompanyProducts";
import CompanyDrivers from "./pages/company/CompanyDrivers";
import CompanyCustomers from "./pages/company/CompanyCustomers";
import CompanyTrips from "./pages/company/CompanyTrips";
import CompanyOrders from "./pages/company/CompanyOrders";
import CompanyVehicles from "./pages/company/CompanyVehicles";
import CompanyPayments from "./pages/company/CompanyPayments";
import CompanyProfile from "./pages/company/CompanyProfile";

// Manager Pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerTrips from "./pages/manager/ManagerTrips";
import ManagerDrivers from "./pages/manager/ManagerDrivers";
import ManagerCustomers from "./pages/manager/ManagerCustomers";
import ManagerProducts from "./pages/manager/ManagerProducts";
import ManagerVehicles from "./pages/manager/ManagerVehicles";
import ManagerOrders from "./pages/manager/ManagerOrders";
import ManagerPayments from "./pages/manager/ManagerPayments";

// Customer Pages
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerTrips from "./pages/customer/CustomerTrips";
import CustomerPayments from "./pages/customer/CustomerPayments";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerTrackTrip from "./pages/customer/TrackTrip";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ==========================================================
              SUPERADMIN
          ========================================================== */}
          <Route
            path="/admin"
            element={
              <RoleRoute roles={["superadmin"]}>
                <AdminLayout />
              </RoleRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
          </Route>

          {/* ==========================================================
              COMPANY OWNER
          ========================================================== */}
          <Route
            path="/company"
            element={
              <RoleRoute roles={["company"]}>
                <CompanyLayout />
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
            <Route path="profile" element={<CompanyProfile />} />
          </Route>

          {/* ==========================================================
              MANAGER
          ========================================================== */}
          <Route
            path="/manager"
            element={
              <RoleRoute roles={["manager"]}>
                <ManagerLayout />
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

          {/* ==========================================================
              CUSTOMER (APP USER)
          ========================================================== */}
          <Route
            path="/customer"
            element={
              <RoleRoute roles={["customer"]}>
                <CustomerLayout />
              </RoleRoute>
            }
          >
            <Route index element={<CustomerDashboard />} />
            <Route path="create-trip" element={<CustomerCreateTrip />} /> {/* ⬅ NEW */}
            <Route path="trips" element={<CustomerTrips />} />
            <Route path="trips/history" element={<CustomerTripHistory />} />
            <Route path="trips/:tripId" element={<CustomerTrackTrip />} />
            <Route path="trips/track/:tripId" element={<CustomerTrackTrip />} />
            <Route path="payments" element={<CustomerPayments />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="edit-profile" element={<CustomerEditProfile />} />
            <Route path="sessions" element={<CustomerSessions />} /> 
            <Route path="select-company" element={<SelectCompany />} />
          </Route>

          {/* ==========================================================
              WILDCARD → LOGIN
          ========================================================== */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
