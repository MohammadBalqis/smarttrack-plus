// client/src/api/managerChatApi.js
import apiClient from "./apiClient";

// Get chat history between this manager and its company
export const getManagerCompanyChatApi = (managerId) =>
  apiClient.get(`/chat/manager-company/${managerId}`);

// Send message from manager to company
export const sendManagerCompanyMessageApi = (message) =>
  apiClient.post("/chat/manager-company/send", { message });
