import axios from "./axiosInstance";

export const getBrandingApi = () => {
  return axios.get("/company/branding");
};

export const updateBrandingApi = (data) => {
  return axios.put("/company/branding", data);
};
