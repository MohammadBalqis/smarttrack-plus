// client/src/api/companyOrdersApi.js
import api from "./axiosConfig";

// 1️⃣ List orders with filters
export const getCompanyOrdersApi = (params = {}) =>
  api.get("/company/orders", { params });

// 2️⃣ Get single order details
export const getCompanyOrderDetailsApi = (orderId) =>
  api.get(`/company/orders/${orderId}`);

// 3️⃣ Update order status (manual — company)
export const updateCompanyOrderStatusApi = (orderId, newStatus) =>
  api.patch(`/company/orders/${orderId}/status`, { newStatus });

// 4️⃣ Get order stats for dashboard
export const getCompanyOrderStatsApi = () =>
  api.get(`/company/orders/stats`);
