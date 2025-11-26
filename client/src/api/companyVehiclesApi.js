// client/src/api/companyVehiclesApi.js
import api from "./axiosConfig";

// List vehicles with filters
export const getCompanyVehiclesApi = (params = {}) =>
  api.get("/company/vehicles", { params });

// Create vehicle (company only)
export const createCompanyVehicleApi = (data) =>
  api.post("/company/vehicles", data);

// Update vehicle (company only)
export const updateCompanyVehicleApi = (vehicleId, data) =>
  api.put(`/company/vehicles/${vehicleId}`, data);

// Assign / remove driver
export const assignCompanyVehicleDriverApi = (vehicleId, driverId) =>
  api.put(`/company/vehicles/${vehicleId}/assign-driver`, {
    driverId: driverId || null,
  });

// Update status
export const updateCompanyVehicleStatusApi = (vehicleId, status) =>
  api.put(`/company/vehicles/${vehicleId}/status`, { status });

// Trip history
export const getCompanyVehicleTripsApi = (vehicleId) =>
  api.get(`/company/vehicles/${vehicleId}/trips`);
