// client/src/api/customerSessionsApi.js
import apiClient from "./apiClient";

export const getSessionsApi = () =>
  apiClient.get("/sessions/my-sessions");

export const logoutSessionApi = (id) =>
  apiClient.delete(`/sessions/logout/${id}`);

export const logoutOtherSessionsApi = () =>
  apiClient.delete("/sessions/logout-all");
