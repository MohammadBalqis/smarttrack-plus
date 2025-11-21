// src/api/companyProductsApi.js
import api from "./apiClient";

/* ==========================================================
   📦 GET COMPANY PRODUCTS (Manager + Company)
   Supports:
   - name search
   - category filter
   - status filter (active / inactive)
========================================================== */

export const getCompanyProductsApi = async (params = {}) => {
  return api.get("/company/products", { params });
};
