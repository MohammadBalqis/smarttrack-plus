import axios from "axios";

/*
  Global Axios Instance
  - Always points to /api
  - Injects auth token & session id
*/
const api = axios.create({
  baseURL:
    (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api",
  withCredentials: true,
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("st_token");
    const sid = localStorage.getItem("st_sid");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (sid) {
      config.headers["x-session-id"] = sid;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
