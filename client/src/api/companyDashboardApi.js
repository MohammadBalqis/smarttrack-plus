// client/src/api/companyDashboardApi.js
import apiClient from "./apiClient"; // same client used in other manager/company APIs

export const getCompanyDashboardApi = () => {
  return apiClient.get("/company/dashboard");
};
