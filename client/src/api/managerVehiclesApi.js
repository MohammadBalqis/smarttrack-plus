// client/src/api/managerVehiclesApi.js
import apiClient from "./apiClient";

/**
 * Update vehicle status (available | in_use | maintenance)
 * Uses backend route: PUT /api/manager/vehicle/:vehicleId/status
 */
export const updateVehicleStatusApi = (vehicleId, status) => {
  return apiClient.put(`/manager/vehicle/${vehicleId}/status`, { status });
};

/**
 * (Optional – for later) Get vehicle trip history
 * Backend: GET /api/manager/vehicle/:vehicleId/trips
 */
export const getVehicleTripsApi = (vehicleId) => {
  return apiClient.get(`/manager/vehicle/${vehicleId}/trips`);
};

/**
 * (Optional – for later) Assign/remove driver to vehicle
 * Backend: PUT /api/manager/vehicle/:vehicleId/assign-driver
 * - pass driverId = null to remove driver
 */
export const assignVehicleDriverApi = (vehicleId, driverId) => {
  return apiClient.put(`/manager/vehicle/${vehicleId}/assign-driver`, {
    driverId: driverId || null,
  });
};
