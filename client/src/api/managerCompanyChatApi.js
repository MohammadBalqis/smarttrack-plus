// client/src/api/managerCompanyChatApi.js
import api from "./apiClient";

// History between company & one manager
export const getManagerCompanyChatHistoryApi = (managerId) =>
  api.get(`/chat/manager-company/${managerId}`);

// Send chat message (company OR manager)
export const sendManagerCompanyMessageApi = (payload) =>
  api.post("/chat/manager-company/send", payload);
// manager can just send { message }
// company sends { message, managerId }
