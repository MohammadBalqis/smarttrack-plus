// client/src/api/customerTripsApi.js
import apiClient from "./apiClient";

// Active orders (pending / assigned / in_progress)
export const getCustomerActiveTripsApi = () =>
  apiClient.get("/customer-trips/active");

// History (delivered / cancelled)
export const getCustomerHistoryTripsApi = () =>
  apiClient.get("/customer-trips/history");
