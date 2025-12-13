import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("st_token");
    const sid = localStorage.getItem("st_sid");

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (sid) config.headers["x-session-id"] = sid;

    return config;
  },
  (err) => Promise.reject(err)
);

export default api;
