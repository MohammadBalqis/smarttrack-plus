// client/src/api/managerLiveApi.js
import apiClient from "./apiClient";

// Live drivers
export const getManagerLiveDriversApi = (params = {}) =>
  apiClient.get("/manager/live/drivers", { params });

// Live trips
export const getManagerLiveTripsApi = (params = {}) =>
  apiClient.get("/manager/live/trips", { params });
