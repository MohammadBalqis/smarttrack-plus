import api from "./apiClient";

export const getOwnerCompanyApplicationsApi = (params = {}) =>
  api.get("/owner/company-applications", { params });

export const approveOwnerCompanyApplicationApi = (id, note = "") =>
  api.patch(`/owner/company-applications/${id}/approve`, { note });

export const rejectOwnerCompanyApplicationApi = (id, reason) =>
  api.patch(`/owner/company-applications/${id}/reject`, { reason });
