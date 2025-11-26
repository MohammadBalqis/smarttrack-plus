import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

export const getManagerDashboardOverviewApi = (params = {}) => {
  return api.get("/manager/dashboard/overview", { params });
};
