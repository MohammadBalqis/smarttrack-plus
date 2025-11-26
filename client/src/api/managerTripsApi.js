// client/src/api/managerTripsApi.js
import apiClient from "./apiClient";

// List trips with filters + pagination
export const getManagerTripsApi = (params) => {
  return apiClient.get("/manager/trips", { params });
};

// Get stats (cards on top)
export const getManagerTripStatsApi = (params) => {
  return apiClient.get("/manager/trips/stats", { params });
};
