// client/src/api/notificationsApi.js
import api from "./axiosConfig";

/* ==========================================================
   🔔 GLOBAL NOTIFICATIONS API (Works for ALL roles)
========================================================== */

/** Fetch notifications with filters */
export const getNotificationsApi = (params = {}) => {
  return api.get("/notifications/list", { params });
};

/** Mark single notification as read */
export const markNotificationReadApi = (id) => {
  return api.patch(`/notifications/mark-read/${id}`);
};

/** Mark ALL notifications as read  */
export const markAllNotificationsApi = () => {
  return api.patch(`/notifications/mark-all`);
};

/** Delete a single notification */
export const deleteNotificationApi = (id) => {
  return api.delete(`/notifications/delete/${id}`);
};

/** Delete ALL notifications */
export const deleteAllNotificationsApi = () => {
  return api.delete(`/notifications/delete-all`);
};
