// client/src/api/companyPaymentsApi.js
import api from "./axiosConfig";

// List payments
export const getCompanyPaymentsApi = (params) =>
  api.get("/company/payments", { params });

// Details
export const getCompanyPaymentDetailsApi = (id) =>
  api.get(`/company/payments/${id}`);

// Stats (dashboard)
export const getCompanyPaymentsStatsApi = () =>
  api.get("/company/payments/stats");
