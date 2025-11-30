// client/src/api/customerTripsApi.js
import apiClient from "./apiClient";

// Active orders (pending / assigned / in_progress)
export const getCustomerActiveTripsApi = () =>
  apiClient.get("/customer-trips/active");

// History (delivered / cancelled)
export const getCustomerHistoryTripsApi = () =>
  apiClient.get("/customer-trips/history");

// ✅ Create new customer trip (order)
export const createCustomerTripApi = (payload) =>
  apiClient.post("/customer-trips/create", payload);

// (For later: tracking screen)
export const getCustomerTripDetailsApi = (tripId) =>
  apiClient.get(`/customer-trips/details/${tripId}`);

// ✅ Customer confirms delivery (will notify company/manager)
export const markTripReceivedApi = (tripId) =>
  apiClient.post(`/customer-trips/${tripId}/confirm-received`);