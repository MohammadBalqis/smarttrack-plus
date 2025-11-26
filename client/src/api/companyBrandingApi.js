// client/src/api/companyBrandingApi.js
import api from "./axiosConfig";

// GET branding
export const getCompanyBrandingApi = () =>
  api.get("/company/branding");

// UPDATE branding
export const updateCompanyBrandingApi = (data) =>
  api.put("/company/branding", data);
