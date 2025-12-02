import apiClient from "./apiClient";

export const getCustomerSettingsApi = () =>
  apiClient.get("/customer/settings");

export const updateCustomerSettingsApi = (data) =>
  apiClient.put("/customer/settings/update", data);
