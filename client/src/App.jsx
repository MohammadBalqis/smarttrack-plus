// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import RoleRoute from "./components/RoleRoute";

/* ==========================================================
   LAYOUTS
========================================================== */
import SystemOwnerLayout from "./layout/SystemOwnerLayout";
import CompanyLayout from "./layout/CompanyLayout";
import ManagerLayout from "./layout/ManagerLayout";
import CustomerLayout from "./layout/CustomerLayout";
import DriverLayout from "./layout/DriverLayout";

/* ==========================================================
   SYSTEM OWNER PAGES
========================================================== */
import SystemOwnerDashboard from "./pages/systemOwner/SystemOwnerDashboard";
import SystemOwnerCompanies from "./pages/systemOwner/SystemOwnerCompanies";
import OwnerBilling from "./pages/systemOwner/OwnerBilling"; // ⬅ placeholder / real page
import OwnerInvoiceDetails from "./pages/systemOwner/OwnerInvoiceDetails";
/* ==========================================================
   COMPANY PAGES
========================================================== */
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyProducts from "./pages/company/CompanyProducts";
import CompanyDrivers from "./pages/company/CompanyDrivers";
import CompanyCustomers from "./pages/company/CompanyCustomers";
import CompanyTrips from "./pages/company/CompanyTrips";
import CompanyOrders from "./pages/company/CompanyOrders";
import CompanyVehicles from "./pages/company/CompanyVehicles";
import CompanyPayments from "./pages/company/CompanyPayments";
import CompanyProfile from "./pages/company/CompanyProfile";
import CompanyLiveTracking from "./pages/company/CompanyLiveTracking";
import CompanySupport from "./pages/company/CompanySupport";
import CompanyChat from "./pages/company/CompanyChat";

/* ==========================================================
   MANAGER PAGES
========================================================== */
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerTrips from "./pages/manager/ManagerTrips";
import ManagerDrivers from "./pages/manager/ManagerDrivers";
import ManagerCustomers from "./pages/manager/ManagerCustomers";
import ManagerProducts from "./pages/manager/ManagerProducts";
import ManagerVehicles from "./pages/manager/ManagerVehicles";
import ManagerOrders from "./pages/manager/ManagerOrders";
import ManagerPayments from "./pages/manager/ManagerPayments";
import ManagerLiveTracking from "./pages/manager/ManagerLiveTracking";
import ManagerChatPage from "./pages/manager/ManagerChatPage";

/* ==========================================================
   CUSTOMER PAGES
========================================================== */
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerTrips from "./pages/customer/CustomerTrips";
import CustomerPayments from "./pages/customer/CustomerPayments";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerTrackTrip from "./pages/customer/TrackTrip";
import CustomerSupport from "./pages/customer/CustomerSupport";
import CustomerCreateTrip from "./pages/customer/CustomerCreateTrip";
import CustomerTripHistory from "./pages/customer/CustomerTripHistory";
import CompanyShops from "./pages/company/CompanyShops";
import CustomerEditProfile from "./pages/customer/CustomerEditProfile";
import CustomerSessions from "./pages/customer/CustomerSessions";
import SelectCompany from "./pages/customer/SelectCompany";

/* ==========================================================
   DRIVER PAGES
========================================================== */
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverScanQR from "./pages/driver/DriverQRScan";
import DriverLiveTrip from "./pages/driver/DriverLiveTrip";
import DriverTrips from "./pages/driver/DriverTrips";
import DriverTripDetails from "./pages/driver/DriverTripDetails";
import DriverPayments from "./pages/driver/DriverPayments";
import DriverPaymentDetails from "./pages/driver/DriverPaymentDetails";
import DriverPaymentsSummary from "./pages/driver/DriverPaymentsSummary";
import DriverNotifications from "./pages/driver/DriverNotifications";
import DriverSettings from "./pages/driver/DriverSettings";

/* ==========================================================
   APP ROUTES
========================================================== */

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ==========================================================
              SYSTEM OWNER
          ========================================================== */}
          <Route
            path="/owner"
            element={
              <RoleRoute roles={["owner", "superadmin"]}>
                <SystemOwnerLayout />
              </RoleRoute>
            }
          >
            <Route index element={<SystemOwnerDashboard />} />
            <Route path="companies" element={<SystemOwnerCompanies />} />
            <Route path="billing" element={<OwnerBilling />} />
            <Route path="billing/:invoiceId" element={<OwnerInvoiceDetails />} />
            <Route path="settings" element={<OwnerSettings />} /> 
          </Route>

          {/* ==========================================================
              COMPANY
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
            <Route path="live-tracking" element={<CompanyLiveTracking />} />
            <Route path="profile" element={<CompanyProfile />} />
            <Route path="support" element={<CompanySupport />} />
            <Route path="chat" element={<CompanyChat />} />
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
            <Route path="live-tracking" element={<ManagerLiveTracking />} />
            <Route path="chat" element={<ManagerChatPage />} />
          </Route>

          {/* ==========================================================
              CUSTOMER
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
            <Route path="create-trip" element={<CustomerCreateTrip />} />
            <Route path="trips" element={<CustomerTrips />} />
            <Route path="trips/history" element={<CustomerTripHistory />} />
            <Route path="trips/:tripId" element={<CustomerTrackTrip />} />
            <Route path="payments" element={<CustomerPayments />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="shops" element={<CompanyShops />} />
            <Route path="edit-profile" element={<CustomerEditProfile />} />
            <Route path="sessions" element={<CustomerSessions />} />
            <Route path="select-company" element={<SelectCompany />} />
            <Route path="support" element={<CustomerSupport />} />
          </Route>

          {/* ==========================================================
              DRIVER — WEB DASHBOARD
          ========================================================== */}
          <Route
            path="/driver"
            element={
              <RoleRoute roles={["driver"]}>
                <DriverLayout />
              </RoleRoute>
            }
          >
            <Route index element={<DriverDashboard />} />
            <Route path="live-trip" element={<DriverLiveTrip />} />
            <Route path="scan-qr" element={<DriverScanQR />} />

            {/* Trips */}
            <Route path="trips" element={<DriverTrips />} />
            <Route path="trips/:tripId" element={<DriverTripDetails />} />

            {/* Payments */}
            <Route path="payments" element={<DriverPayments />} />
            <Route path="payments/:paymentId" element={<DriverPaymentDetails />} />
            <Route path="payments-summary" element={<DriverPaymentsSummary />} />

            {/* Notifications */}
            <Route path="notifications" element={<DriverNotifications />} />

            {/* Settings */}
            <Route path="settings" element={<DriverSettings />} />
          </Route>

          {/* ==========================================================
              FALLBACK → LOGIN
          ========================================================== */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
