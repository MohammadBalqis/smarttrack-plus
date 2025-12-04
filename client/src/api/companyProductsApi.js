// client/src/api/companyProductsApi.js
import api from "./apiClient";

/* ==========================================================
   📦 GET PRODUCTS (list)
========================================================== */
export const getCompanyProductsApi = (params = {}) => {
  return api.get("/company/products", { params });
};

/* ==========================================================
   ➕ CREATE PRODUCT
========================================================== */
export const createCompanyProductApi = (data) => {
  return api.post("/company/products", data);
};

/* ==========================================================
   ✏️ UPDATE PRODUCT
========================================================== */
export const updateCompanyProductApi = (productId, data) => {
  return api.put(`/company/products/${productId}`, data);
};

/* ==========================================================
   🔄 TOGGLE ACTIVE / INACTIVE
========================================================== */
export const toggleCompanyProductActiveApi = (productId) => {
  return api.patch(`/company/products/${productId}/toggle`);
};

/* ==========================================================
   🔍 GET SINGLE PRODUCT
========================================================== */
export const getSingleCompanyProductApi = (productId) => {
  return api.get(`/company/products/${productId}`);
};

/* ==========================================================
   📉📈 ADJUST STOCK
========================================================== */
export const adjustCompanyProductStockApi = (
  productId,
  amount,
  reason = ""
) => {
  return api.patch(`/company/products/${productId}/stock`, {
    amount,
    reason,
  });
};
