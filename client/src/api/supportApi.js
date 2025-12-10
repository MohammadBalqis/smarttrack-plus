// client/src/api/supportApi.js
import api from "./apiClient";

// Customer sends support message (Option A → one way)
export const sendSupportMessageApi = (message, extra = {}) =>
  api.post("/customer/support", {
    message,
    ...extra, // optional: tripId, orderId, companyId
  });

// Company loads all support messages
export const getCompanySupportMessagesApi = () =>
  api.get("/company/support/messages");

// Company updates status: open / reviewed / resolved
export const updateSupportStatusApi = (id, status) =>
  api.patch(`/company/support/${id}/status`, { status });
