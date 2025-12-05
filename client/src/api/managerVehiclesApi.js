import apiClient from "./apiClient";

// List all vehicles for this manager
export const getManagerVehiclesApi = () =>
  apiClient.get("/manager/vehicles");

// Assign a driver
export const assignDriverApi = (vehicleId, driverId) =>
  apiClient.put(`/manager/vehicle/${vehicleId}/assign-driver`, { driverId });

// Remove driver
export const removeDriverApi = (vehicleId) =>
  apiClient.put(`/manager/vehicle/${vehicleId}/assign-driver`, { driverId: null });

// Update vehicle status
export const updateVehicleStatusApi = (vehicleId, status) =>
  apiClient.put(`/manager/vehicle/${vehicleId}/status`, { status });

// Fetch trip history
export const getVehicleTripsApi = (vehicleId) =>
  apiClient.get(`/manager/vehicle/${vehicleId}/trips`);
