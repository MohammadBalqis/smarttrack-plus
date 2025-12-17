import api from "./apiClient";

export const getManagerDriversApi = () =>
  api.get("/manager/drivers");

export const createDriverProfileApi = (data) =>
  api.post("/manager/drivers", data);

export const submitDriverVerificationApi = (driverId, formData) =>
  api.patch(`/manager/drivers/${driverId}/verification`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const createDriverAccountApi = (driverId, data) =>
  api.post(`/manager/drivers/${driverId}/create-account`, data);

export const toggleDriverSuspendApi = (driverId) =>
  api.patch(`/manager/drivers/${driverId}/toggle-suspend`);

export const deleteDriverApi = (driverId) =>
  api.delete(`/manager/drivers/${driverId}`);
