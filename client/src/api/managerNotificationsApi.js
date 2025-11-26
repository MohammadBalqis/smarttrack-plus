import api from "./apiClient";

// Get all notifications for manager
export const getManagerNotificationsApi = () =>
  api.get("/manager/notifications");

// Mark single notification as read
export const markNotificationAsReadApi = (id) =>
  api.patch(`/manager/notifications/${id}/read`);

// Mark all notifications as read
export const markAllNotificationsAsReadApi = () =>
  api.patch("/manager/notifications/read-all");
