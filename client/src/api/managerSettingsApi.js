import api from "./axiosInstance";

export const getManagerProfileApi = () =>
  api.get("/manager/profile");
