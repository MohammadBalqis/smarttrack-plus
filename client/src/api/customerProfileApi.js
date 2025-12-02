import apiClient from "./apiClient";

export const getCustomerProfileApi = () =>
  apiClient.get("/customer/profile");

export const updateCustomerProfileApi = (data) =>
  apiClient.put("/customer/profile/update-profile", data);

export const updateCustomerImageApi = (formData) =>
  apiClient.put("/customer/profile/update-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
