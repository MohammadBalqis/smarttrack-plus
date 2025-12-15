// client/src/api/managerDashboardApi.js
import apiClient from "./apiClient";

/*
  Manager Dashboard APIs
  Uses global apiClient (token + session aware)
*/

export const getManagerDashboardStatsApi = () => {
  return apiClient.get("/manager/dashboard/stats");
};
