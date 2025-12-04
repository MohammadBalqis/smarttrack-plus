// client/src/api/companyDriversApi.js
import api from "./apiClient";

/* ------------------ GET ALL DRIVERS ------------------ */
export const getCompanyDriversApi = (params = {}) => {
  return api.get("/company/drivers", { params });
};

/* ------------------ DRIVER STATS --------------------- */
export const getCompanyDriverStatsApi = (driverId) => {
  return api.get(`/company/drivers/${driverId}/stats`);
};

// Alias for compatibility
export const getDriverStatsApi = getCompanyDriverStatsApi;

/* ------------------ RECENT TRIPS ------------------ */
export const getDriverRecentTripsApi = (driverId, limit = 10) => {
  return api.get(`/company/drivers/${driverId}/recent-trips`, {
    params: { limit },
  });
};

// Alias for compatibility with your frontend
export const getCompanyDriverRecentTripsApi = getDriverRecentTripsApi;

/* ------------------ SINGLE DRIVER ------------------ */
export const getSingleDriverApi = (driverId) => {
  return api.get(`/company/drivers/${driverId}`);
};

/* ------------------ CREATE DRIVER ------------------ */
export const createCompanyDriverApi = (data) => {
  return api.post("/company/drivers", data);
};

/* ------------------ UPDATE DRIVER ------------------ */
export const updateCompanyDriverApi = (driverId, data) => {
  return api.put(`/company/drivers/${driverId}`, data);
};

/* ------------------ TOGGLE DRIVER ACTIVE/INACTIVE ------------------ */
export const toggleCompanyDriverActiveApi = (driverId) => {
  return api.patch(`/company/drivers/${driverId}/toggle`);
};

// Alias for compatibility with older code
export const toggleCompanyDriverStatusApi =
  toggleCompanyDriverActiveApi;
