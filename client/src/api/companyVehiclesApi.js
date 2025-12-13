// client/src/api/companyVehiclesApi.js
import api from "./axiosConfig";

/* ==========================================================
   🚗 COMPANY VEHICLES — READ ONLY
========================================================== */

// GET /api/company/vehicles
export const getCompanyVehiclesApi = (params = {}) =>
  api.get("/company/vehicles", { params });

/* ==========================================================
   🔄 UPDATE VEHICLE STATUS
   allowed: available | maintenance
========================================================== */

// PUT /api/company/vehicles/:id/status
export const updateCompanyVehicleStatusApi = (vehicleId, status) =>
  api.put(`/company/vehicles/${vehicleId}/status`, { status });

/* ==========================================================
   📜 VEHICLE TRIP HISTORY
========================================================== */

// GET /api/company/vehicles/:id/trips
export const getCompanyVehicleTripsApi = (vehicleId) =>
  api.get(`/company/vehicles/${vehicleId}/trips`);
