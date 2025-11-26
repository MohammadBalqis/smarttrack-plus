import api from "./axiosConfig";

export const getCompanyDashboardStatsApi = () =>
  api.get("/company/dashboard/stats");

export const getCompanyDashboardRecentTripsApi = () =>
  api.get("/company/dashboard/recent-trips");

export const getCompanyDashboardRecentOrdersApi = () =>
  api.get("/company/dashboard/recent-orders");

export const getCompanyDashboardRecentPaymentsApi = () =>
  api.get("/company/dashboard/recent-payments");
