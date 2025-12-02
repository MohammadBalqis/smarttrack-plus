import apiClient from "./apiClient";

export const getMySessionsApi = () =>
  apiClient.get("/sessions/my-sessions");

export const logoutSessionApi = (id) =>
  apiClient.delete(`/sessions/logout/${id}`);

export const logoutAllSessionsApi = () =>
  apiClient.delete("/sessions/logout-all");
