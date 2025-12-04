// client/src/api/companyTripsApi.js
import api from "./apiClient";

/* ==========================================================
   🚚 GET ALL COMPANY TRIPS (filters, pagination)
========================================================== */
export const getCompanyTripsApi = (params = {}) => {
  return api.get("/company/trips", { params });
};

/* ==========================================================
   🔍 GET TRIP DETAILS
========================================================== */
export const getCompanyTripDetailsApi = (tripId) => {
  return api.get(`/company/trips/${tripId}`);
};

/* ==========================================================
   📊 GET TRIP STATS (counts, revenue, durations...)
========================================================== */
export const getCompanyTripStatsApi = (params = {}) => {
  return api.get("/company/trips/stats", { params });
};

/* ==========================================================
   🔄 UPDATE TRIP STATUS (assigned → in_progress → delivered)
========================================================== */
export const updateCompanyTripStatusApi = (tripId, status) => {
  return api.patch(`/company/trips/${tripId}/status`, { status });
};

/* ==========================================================
   👤 ASSIGN DRIVER TO TRIP
========================================================== */
export const assignDriverToTripApi = (tripId, driverId) => {
  return api.patch(`/company/trips/${tripId}/assign-driver`, {
    driverId,
  });
};

/* ==========================================================
   🕒 GET TIMELINE / HISTORY OF A TRIP
========================================================== */
export const getCompanyTripTimelineApi = (tripId) => {
  return api.get(`/company/trips/${tripId}/timeline`);
};

/* ==========================================================
   🎯 COMPATIBILITY ALIASES
   (older components use these names)
========================================================== */
export const getTripDetailsApi = getCompanyTripDetailsApi;
export const getTripStatsApi = getCompanyTripStatsApi;
export const updateTripStatusApi = updateCompanyTripStatusApi;
export const assignTripDriverApi = assignDriverToTripApi;
