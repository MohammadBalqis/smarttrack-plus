import apiClient from "./apiClient";

/* ==========================================================
   🔔 MANAGER NOTIFICATIONS API (FIXED)
========================================================== */

// Get manager notifications
export const getManagerNotificationsApi = (params = {}) =>
  apiClient.get("/manager/notifications", { params });

// Mark single notification as read
export const markManagerNotificationReadApi = (id) =>
  apiClient.patch(`/manager/notifications/${id}/read`);

// Mark ALL notifications as read
export const markAllManagerNotificationsApi = () =>
  apiClient.patch("/manager/notifications/read-all");

// ❌ REMOVE delete endpoints unless backend supports them
