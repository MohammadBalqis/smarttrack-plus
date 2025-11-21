import api from "./axiosConfig";

export const getSuperadminStatsApi = () => api.get("/admin/stats");
