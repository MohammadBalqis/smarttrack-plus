// client/src/api/managerProductsApi.js
import apiClient from "./clientApi";

// 📦 Get list of products for the manager (view-only)
export const getManagerProductsApi = (params = {}) => {
  return apiClient.get("/manager/products", { params });
};

// 🔍 Get a single product by id
export const getManagerProductApi = (id) => {
  return apiClient.get(`/manager/product/${id}`);
};
