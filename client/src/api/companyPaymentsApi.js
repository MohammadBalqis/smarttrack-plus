// client/src/api/companyPaymentsApi.js
import apiClient from "./clientApi";

// 🧾 Get company/manager payments (with filters + pagination)
export const getCompanyPaymentsApi = async (params = {}) => {
  return apiClient.get("/payments/company", { params });
};

// 📊 Get summary for dashboard cards
export const getCompanyPaymentsSummaryApi = async (params = {}) => {
  return apiClient.get("/payments/summary/company", { params });
};

// 🔍 Single payment details
export const getPaymentDetailsApi = async (paymentId) => {
  return apiClient.get(`/payments/details/${paymentId}`);
};

// 💸 Refund a payment (owner/superadmin, but we keep here for future)
export const refundPaymentApi = async (paymentId, payload = {}) => {
  return apiClient.post(`/payments/refund/${paymentId}`, payload);
};
