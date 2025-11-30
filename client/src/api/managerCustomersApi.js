// client/src/api/managerCustomersApi.js
import apiClient from "./apiClient";

// List customers with filters + pagination
export const getManagerCustomersApi = (params = {}) =>
  apiClient.get("/manager/customers", { params });

// Single customer details (profile + stats + recent trips)
export const getManagerCustomerDetailsApi = (customerId) =>
  apiClient.get(`/manager/customer/${customerId}`);

export const toggleManagerCustomerStatusApi = (customerId) =>
  api.patch(`/manager/customers/${customerId}/toggle-active`);
