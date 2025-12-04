// client/src/api/managerProductsApi.js
import apiClient from "./apiClient";

// 🔹 List products for this manager's shop
export const getManagerProductsApi = (params = {}) =>
  apiClient.get("/manager/products", { params });

// 🔹 Single product (details drawer)
export const getManagerProductApi = (productId) =>
  apiClient.get(`/manager/products/${productId}`);

// 🔹 Company catalog (global products)
export const getManagerGlobalProductsApi = (params = {}) =>
  apiClient.get("/manager/products/global", { params });

// 🔹 Add product from company catalog into this manager's shop
export const addManagerProductFromCompanyApi = (productId, payload = {}) =>
  apiClient.post(`/manager/products/add-from-company/${productId}`, payload);

export const updateManagerProductApi = (productId, data) =>
  apiClient.patch(`/manager/products/${productId}`, data);
