import api from "./axiosConfig";

/* =========================
   PROFILE
========================= */
export const getManagerProfileApi = () =>
  api.get("/manager/profile");

export const updateManagerProfileApi = (data) =>
  api.put("/manager/profile", data);

/* =========================
   PASSWORD
========================= */
export const updateManagerPasswordApi = (data) =>
  api.put("/manager/profile/password", data);
