// client/src/api/companySettingsApi.js
import apiClient from "./apiClient";

// GET current company profile + settings
export const getCompanyProfileApi = () =>
  apiClient.get("/company/settings/profile");

// UPDATE basic company profile
export const updateCompanyProfileApi = (payload) =>
  apiClient.put("/company/settings/profile", payload);

// UPDATE password
export const updateCompanyPasswordApi = (payload) =>
  apiClient.put("/company/settings/password", payload);

// UPDATE preferences (notifications, language, timezone, etc.)
export const updateCompanyPreferencesApi = (payload) =>
  apiClient.put("/company/settings/preferences", payload);
