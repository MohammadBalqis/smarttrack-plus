// client/src/api/companyProductsApi.js
import apiClient from "./apiClient";

// List products
export const getCompanyProductsApi = (params = {}) =>
  apiClient.get("/company/products", { params });

// Single product
export const getSingleCompanyProductApi = (id) =>
  apiClient.get(`/company/products/${id}`);

// Create
export const createCompanyProductApi = (payload) =>
  apiClient.post("/company/products", payload);

// Update
export const updateCompanyProductApi = (id, payload) =>
  apiClient.put(`/company/products/${id}`, payload);

// Toggle active
export const toggleCompanyProductActiveApi = (id) =>
  apiClient.put(`/company/products/${id}/toggle`);

// Adjust stock
export const adjustCompanyProductStockApi = (id, change, reason) =>
  apiClient.post(`/company/products/${id}/stock`, { change, reason });
