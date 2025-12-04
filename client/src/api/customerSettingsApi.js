import apiClient from "./apiClient";

export const changeCustomerPasswordApi = (data) =>
  apiClient.put("/customer/profile/change-password", data);

export const updateCustomerNotificationsApi = (data) =>
  apiClient.put("/customer/profile/notification-settings", data);

export const deleteCustomerAccountApi = () =>
  apiClient.delete("/customer/profile/delete-account");
