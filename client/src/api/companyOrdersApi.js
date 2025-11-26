// client/src/api/companyDriversApi.js
import api from "./apiClient";

/* ==========================================================
   🚚 COMPANY DRIVERS API (Owner + Manager View/Edit/Create)
   ========================================================== */

// GET all drivers (optionally filter: ?status=active / inactive)
export const getCompanyDriversApi = (params = {}) =>
  api.get("/company/drivers", { params });

// CREATE driver
export const createCompanyDriverApi = (payload) =>
  api.post("/company/drivers", payload);

// UPDATE driver info
export const updateCompanyDriverApi = (id, payload) =>
  api.put(`/company/drivers/${id}`, payload);

// TOGGLE active / inactive
export const toggleCompanyDriverStatusApi = (id) =>
  api.patch(`/company/drivers/${id}/toggle-active`);

// GET stats for single driver
export const getCompanyDriverStatsApi = (id) =>
  api.get(`/company/drivers/${id}/stats`);

// GET recent delivered trips for driver
export const getCompanyDriverRecentTripsApi = (id) =>
  api.get(`/company/drivers/${id}/recent-trips`);
