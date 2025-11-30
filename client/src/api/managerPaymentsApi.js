// client/src/api/managerPaymentsApi.js
import api from "./apiClient";

/* ==========================================================
   📄 GET PAYMENTS LIST
========================================================== */
export const getManagerPaymentsApi = (params) =>
  api.get("/manager/payments", { params });

/* ==========================================================
   📊 GET SUMMARY
========================================================== */
export const getManagerPaymentsSummaryApi = (params) =>
  api.get("/manager/payments-summary", { params });

/* ==========================================================
   🔎 GET DETAILS
========================================================== */
export const getManagerPaymentDetailsApi = (paymentId) =>
  api.get(`/manager/payments/${paymentId}`);
