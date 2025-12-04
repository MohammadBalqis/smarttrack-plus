// client/src/api/customerAccountApi.js
import apiClient from "./apiClient";

export const deleteMyAccountApi = (payload) =>
  apiClient.delete("/customer/profile/delete-account", {
    data: payload, // axios allows body for DELETE via `data`
  });
