// client/src/api/companyShopsApi.js
import apiClient from "./apiClient";

// List all shops for current company
export const getCompanyShopsApi = () =>
  apiClient.get("/company/shops");

// Create a new shop
export const createCompanyShopApi = (data) =>
  apiClient.post("/company/shops", data);

// Get single shop (for edit later if needed)
export const getCompanyShopDetailsApi = (id) =>
  apiClient.get(`/company/shops/${id}`);

// Update shop
export const updateCompanyShopApi = (id, data) =>
  apiClient.patch(`/company/shops/${id}`, data);

// Deactivate shop (soft delete)
export const deactivateCompanyShopApi = (id) =>
  apiClient.delete(`/company/shops/${id}`);
