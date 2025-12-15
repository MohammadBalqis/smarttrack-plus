// client/src/api/companyChatApi.js
import api from "./apiClient";

/* ==========================================================
   💬 GET MANAGERS FOR COMPANY CHAT
========================================================== */
export const getManagersForCompanyChatApi = () => {
  return api.get("/company/manager/list");
};
