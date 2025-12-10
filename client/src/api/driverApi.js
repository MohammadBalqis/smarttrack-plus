// client/src/api/driverApi.js
import api from "./apiClient";

/* ==========================================================
   📊 DRIVER DASHBOARD
========================================================== */

// Dashboard summary stats
export const getDriverDashboardApi = () =>
  api.get("/driver/dashboard");

// Recent trips for dashboard widget
export const getDriverRecentTripsApi = () =>
  api.get("/driver/recent-trips");

// Toggle online/offline status
export const toggleDriverStatusApi = () =>
  api.post("/driver/toggle-status");


/* ==========================================================
   🛣️ DRIVER TRIPS (HISTORY + ACTIVE)
========================================================== */

// List trips with filters
export const getDriverTripsFilteredApi = (params = {}) =>
  api.get("/driver/trips", { params });

// Backward My Trips
export const getDriverTripsApi = (params = {}) =>
  api.get("/driver/trips", { params });

// Active trip
export const getDriverActiveTripApi = () =>
  api.get("/driver/trips/active");

// Trip by ID
export const getDriverTripByIdApi = (tripId) =>
  api.get(`/driver/trips/${tripId}`);

// Update trip status
export const updateDriverTripStatusApi = (tripId, payload) =>
  api.patch(`/driver/trips/${tripId}/status`, payload);


/* ==========================================================
   📍 LIVE LOCATION (Tracking)
========================================================== */

// Save GPS location to the active trip
export const saveDriverLocationApi = (tripId, point) =>
  api.put(`/driver/trips/${tripId}/location`, point);


/* ==========================================================
   🧾 QR DELIVERY CONFIRMATION
========================================================== */

export const confirmTripByQrApi = (qrData) =>
  api.post("/driver/trips/confirm-qr", { qrData });

export const confirmDeliveryFromQrApi = (qrPayload) =>
  confirmTripByQrApi(qrPayload);


/* ==========================================================
   🚗 VEHICLE & PAYMENTS
========================================================== */

// Vehicle assigned to driver
export const getDriverVehicleApi = () =>
  api.get("/driver/vehicle");

// Payments list (earnings history)
export const getDriverPaymentsApi = () =>
  api.get("/driver/payments");

// ⭐ NEW — Payment Details (Fixes the error)
export const getDriverPaymentDetailsApi = (paymentId) =>
  api.get(`/driver/payments/${paymentId}`);


/* ==========================================================
   🔔 NOTIFICATIONS
========================================================== */

// Get driver's notifications
export const getDriverNotificationsApi = () =>
  api.get("/driver/notifications");

// Mark all notifications as read
export const markDriverNotificationReadApi = () =>
  api.post("/driver/notifications/read-all");


/* ==========================================================
   👤 PROFILE (Settings)
========================================================== */

export const getDriverProfileApi = () =>
  api.get("/driver/profile");

export const updateDriverProfileApi = (data) =>
  api.put("/driver/profile", data);


/* ==========================================================
   🟢 ACCEPT / DECLINE TRIP
========================================================== */

export const acceptDriverTripApi = (tripId) =>
  api.post("/driver/trips/accept", { tripId });

export const declineDriverTripApi = (tripId) =>
  api.post("/driver/trips/decline", { tripId });
