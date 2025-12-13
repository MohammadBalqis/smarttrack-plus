import api from "./apiClient";


/* ============================
   COMPANY ORDERS API
============================ */

// List orders
export const getCompanyOrdersApi = (params = {}) =>
  api.get("/company/orders", { params });

// Single order details
export const getCompanyOrderDetailsApi = (orderId) =>
  api.get(`/company/orders/${orderId}`);

// Update order status
export const updateCompanyOrderStatusApi = (orderId, newStatus) =>
  api.patch(`/company/orders/${orderId}/status`, { newStatus });

// Orders statistics
export const getCompanyOrdersStatsApi = () =>
  api.get("/company/orders/stats");
