import api from "./apiClient";

/* ==========================================================
   CUSTOMER → COMPANY APIs
========================================================== */

/* 📋 List all companies customer can order from */
export const getCustomerCompaniesApi = () =>
  api.get("/customer/companies");

/* 🏢 Select a company for current customer */
export const selectCustomerCompanyApi = (companyId) =>
  api.post("/customer/select-company", { companyId });

/* ⭐ Get currently active (selected) company */
export const getActiveCustomerCompanyApi = () =>
  api.get("/customer/active-company");

/* ==========================================================
   🔥 BACKWARD-COMPATIBILITY ALIASES
   (prevents import crashes in other files)
========================================================== */

// older / mistaken imports support
export const selectCompanyApi = selectCustomerCompanyApi;
export const getCustomerActiveCompanyApi = getActiveCustomerCompanyApi;
export const getActiveCompanyApi = getActiveCustomerCompanyApi;
