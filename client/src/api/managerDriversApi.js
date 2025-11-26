import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// GET /api/manager/drivers
export const getManagerDriversApi = (params = {}) => {
  return api.get("/manager/drivers", { params });
};

// PUT /api/manager/driver/:driverId/status
export const toggleManagerDriverStatusApi = (driverId, isActive) => {
  return api.put(`/manager/driver/${driverId}/status`, { isActive });
};

// PUT /api/manager/driver/:driverId/edit
export const updateManagerDriverApi = (driverId, data) => {
  return api.put(`/manager/driver/${driverId}/edit`, data);
};

// GET /api/manager/driver/:driverId/stats
export const getManagerDriverStatsApi = (driverId) => {
  return api.get(`/manager/driver/${driverId}/stats`);
};

// GET /api/manager/driver/:driverId/recent-trips
export const getManagerDriverRecentTripsApi = (driverId) => {
  return api.get(`/manager/driver/${driverId}/recent-trips`);
};
