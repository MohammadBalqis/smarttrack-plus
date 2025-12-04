// client/src/api/customerCompanyApi.js
import api from "./apiClient";

// List all companies the customer can order from
export const getCustomerCompaniesApi = () =>
  api.get("/customer/companies");

// Select a company for the current customer
export const selectCustomerCompanyApi = (companyId) =>
  api.post("/customer/select-company", { companyId });

// Get currently active company for this customer
export const getActiveCustomerCompanyApi = () =>
  api.get("/customer/active-company");

// Duplicate variant (fixed to use correct axios instance)
export const getCustomerActiveCompanyApi = () =>
  api.get("/customer/active-company");

// 🔥 Compatibility alias (this fixes your error)
export const getActiveCompanyApi = getActiveCustomerCompanyApi;
