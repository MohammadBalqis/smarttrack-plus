// client/src/api/systemOwnerCompaniesApi.js
import api from "./apiClient";

/* ==========================================================
   SYSTEM OWNER — COMPANY MANAGEMENT API
========================================================== */

// 1) Get company details (full object)
export const getOwnerCompanyDetailsApi = (companyId) =>
  api.get(`/owner/company/${companyId}`);

// 2) Update subscription plan
export const updateOwnerCompanySubscriptionApi = (companyId, data) =>
  api.put(`/owner/company/${companyId}/subscription`, data);

// 3) Update status (active / suspended)
export const updateOwnerCompanyStatusApi = (companyId, data) =>
  api.put(`/owner/company/${companyId}/status`, data);

// 4) Update limits (maxDrivers)
export const updateOwnerCompanyLimitsApi = (companyId, data) =>
  api.put(`/owner/company/${companyId}/limits`, data);

// 5) Delete company
export const deleteOwnerCompanyApi = (companyId) =>
  api.delete(`/owner/company/${companyId}`);
