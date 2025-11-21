// src/api/companyVehiclesApi.js
import api from "./apiClient";

/* ==========================================================
   🚘 GET COMPANY VEHICLES
   Supports filters:
   - type
   - status
   - driverId
   - plate (search)
========================================================== */

export const getCompanyVehiclesApi = (params = {}) => {
  return api.get("/company/vehicles", { params });
};
