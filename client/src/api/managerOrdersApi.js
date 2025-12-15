import api from "./apiClient";

/* =========================
   ORDERS
========================= */
export const getManagerOrdersApi = (params) =>
  api.get("/manager/orders", { params });

export const getManagerOrderDetailsApi = (orderId) =>
  api.get(`/manager/orders/${orderId}`);

export const getManagerOrderTimelineApi = (orderId) =>
  api.get(`/manager/orders/${orderId}/timeline`);

/* =========================
   SUMMARY
========================= */
export const getManagerOrdersSummaryApi = (params) =>
  api.get("/manager/orders-summary", { params });

/* =========================
   DRIVERS
========================= */
export const getAvailableDriversForOrdersApi = () =>
  api.get("/manager/orders/available-drivers");

/* =========================
   ASSIGN DRIVER
========================= */
export const assignDriverToOrderApi = (orderId, data) =>
  api.patch(`/manager/orders/${orderId}/assign-driver`, data);

/* =========================
   QR
========================= */
export const generateOrderDeliveryQrApi = (orderId) =>
  api.post(`/manager/orders/${orderId}/generate-qr`);
