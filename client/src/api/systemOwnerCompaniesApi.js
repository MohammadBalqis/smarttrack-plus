// client/src/api/systemOwnerCompaniesApi.js
import api from "./apiClient";

/* ==========================================================
   GET COMPANY DETAILS
========================================================== */
export const getOwnerCompanyDetailsApi = (id) =>
  api.get(`/owner/company/${id}`);

/* ==========================================================
   UPDATE SUBSCRIPTION
========================================================== */
export const updateOwnerCompanySubscriptionApi = (id, data) =>
  api.patch(`/owner/company/${id}/subscription`, data);

/* ==========================================================
   UPDATE STATUS (active | suspended)
========================================================== */
export const updateOwnerCompanyStatusApi = (id, data) =>
  api.patch(`/owner/company/${id}/status`, data);

/* ==========================================================
   UPDATE LIMITS
========================================================== */
export const updateOwnerCompanyLimitsApi = (id, data) =>
  api.patch(`/owner/company/${id}/limits`, data);

/* ==========================================================
   SOFT DELETE (Suspend company)
========================================================== */
export const deleteOwnerCompanyApi = (id) =>
  api.delete(`/owner/company/${id}`);

/* ==========================================================
   🔥 HARD DELETE (Permanent)
   - Deletes company
   - Deletes owner account
   - Deletes managers & drivers
========================================================== */
export const deleteOwnerCompanyPermanentApi = (id) =>
  api.delete(`/owner/company/${id}/permanent`);
