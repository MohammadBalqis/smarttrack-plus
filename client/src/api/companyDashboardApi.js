import api from "./axiosConfig";

export const getCompanyDashboardStatsApi = () =>
  api.get("/company/dashboard/stats");
