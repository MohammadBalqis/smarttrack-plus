// client/src/api/customerPaymentsApi.js
import apiClient from "./apiClient";

// List all payments
export const getCustomerPaymentsApi = () =>
  apiClient.get("/customer/payments");

// Get single payment
export const getCustomerSinglePaymentApi = (paymentId) =>
  apiClient.get(`/customer/payments/${paymentId}`);
