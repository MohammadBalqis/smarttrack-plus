import apiClient from "./apiClient";

export const getCustomerNotificationsApi = () =>
  apiClient.get("/notifications/list?status=unread");

export const markNotificationReadApi = (id) =>
  apiClient.patch(`/notifications/mark-read/${id}`);
