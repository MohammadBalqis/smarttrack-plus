import apiClient from "./apiClient";

/* ==========================================================
   🏬 MANAGER SHOP PRODUCTS API (REAL BACKEND ROUTES)
========================================================== */

// List products in manager shop
export const getManagerProductsApi = (params = {}) =>
  apiClient.get("/manager/shop-products", { params });

// Available products from company catalog
export const getManagerGlobalProductsApi = (params = {}) =>
  apiClient.get("/manager/shop-products/available", { params });

// Add product to shop
export const addManagerProductFromCompanyApi = (productId, payload) =>
  apiClient.post("/manager/shop-products/add", {
    productId,
    ...payload,
  });

// Update stock
export const updateManagerProductStockApi = (id, stock) =>
  apiClient.put(`/manager/shop-products/${id}/stock`, { stock });

// Update price / discount
export const updateManagerProductPriceApi = (id, data) =>
  apiClient.put(`/manager/shop-products/${id}/price`, data);

// Toggle active / inactive
export const toggleManagerProductApi = (id) =>
  apiClient.put(`/manager/shop-products/${id}/toggle`);
