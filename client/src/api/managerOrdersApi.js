// client/src/api/managerOrdersApi.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// 📦 List orders (with filters + pagination)
export const getManagerOrdersApi = (params = {}) => {
  return axios.get(`${API_BASE_URL}/manager/orders`, {
    params,
    withCredentials: true,
  });
};

// 🔎 Single order details (with items, customer, driver, etc.)
export const getManagerOrderDetailsApi = (orderId) => {
  return axios.get(`${API_BASE_URL}/manager/orders/${orderId}`, {
    withCredentials: true,
  });
};

// 📝 Order timeline (optional, extra info)
export const getManagerOrderTimelineApi = (orderId) => {
  return axios.get(
    `${API_BASE_URL}/manager/orders/${orderId}/timeline`,
    { withCredentials: true }
  );
};

// 📊 Summary for dashboard cards (today/this week/etc.)
export const getManagerOrdersSummaryApi = (params = {}) => {
  return axios.get(`${API_BASE_URL}/manager/orders-summary`, {
    params,
    withCredentials: true,
  });
};
