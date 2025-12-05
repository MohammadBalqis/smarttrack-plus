// client/src/api/managerProductsApi.js
import apiClient from "./apiClient";

// List products for manager (shop) / company
export const getManagerProductsApi = (params = {}) =>
  apiClient.get("/manager/products", { params });

// Get single product
export const getManagerProductApi = (productId) =>
  apiClient.get(`/manager/products/${productId}`);

// Company global catalog (base products)
export const getManagerGlobalProductsApi = (params = {}) =>
  apiClient.get("/manager/products/global", { params });

// Add base product into manager's shop
export const addManagerProductFromCompanyApi = (productId, payload) =>
  apiClient.post(`/manager/products/add-from-company/${productId}`, payload);

// Update shop product (Option B fields)
export const updateManagerProductApi = (productId, data) =>
  apiClient.patch(`/manager/products/${productId}`, data);
