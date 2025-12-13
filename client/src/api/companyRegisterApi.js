import api from "./apiClient";

export const submitCompanyApplicationApi = (formData) => {
  return api.post("/company/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
