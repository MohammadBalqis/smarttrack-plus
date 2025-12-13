import api from "./apiClient";

export const registerCompanyApi = (data) =>
  api.post("/auth/register-company", data);
