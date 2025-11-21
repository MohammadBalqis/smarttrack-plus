import api from "./axiosConfig";

export const getCompanyDriversApi = (params) =>
  api.get("/company/drivers", { params });

export const createCompanyDriverApi = (data) =>
  api.post("/company/drivers", data);

export const updateCompanyDriverApi = (id, data) =>
  api.put(`/company/drivers/${id}`, data);

export const toggleCompanyDriverStatusApi = (id) =>
  api.patch(`/company/drivers/${id}/toggle-active`);

export const getCompanyDriverStatsApi = (id) =>
  api.get(`/company/drivers/${id}/stats`);

export const getCompanyDriverRecentTripsApi = (id) =>
  api.get(`/company/drivers/${id}/recent-trips`);
