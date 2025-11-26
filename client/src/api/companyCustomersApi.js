import api from "./axiosConfig";

// List customers (supports ?status=&search=)
export const getCompanyCustomersApi = (params = {}) =>
  api.get("/company/customers", { params });

// Stats for one customer
export const getCompanyCustomerStatsApi = (customerId) =>
  api.get(`/company/customers/${customerId}/stats`);

// Orders for one customer
export const getCompanyCustomerOrdersApi = (customerId) =>
  api.get(`/company/customers/${customerId}/orders`);

// Toggle active / inactive customer
export const toggleCompanyCustomerStatusApi = (customerId) =>
  api.patch(`/company/customers/${customerId}/toggle-active`);
