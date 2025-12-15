import apiClient from "./apiClient";

/* ==========================================================
   🔔 MANAGER NOTIFICATIONS API
========================================================== */

// Get manager notifications
export const getManagerNotificationsApi = (params = {}) =>
  apiClient.get("/manager/notifications/list", { params });

// Mark single notification as read
export const markManagerNotificationReadApi = (id) =>
  apiClient.patch(`/manager/notifications/mark-read/${id}`);

// Mark ALL notifications as read
export const markAllManagerNotificationsApi = () =>
  apiClient.patch("/manager/notifications/mark-all");

// Delete single notification
export const deleteManagerNotificationApi = (id) =>
  apiClient.delete(`/manager/notifications/delete/${id}`);

// Delete ALL notifications
export const deleteAllManagerNotificationsApi = () =>
  apiClient.delete("/manager/notifications/delete-all");
