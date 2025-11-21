import api from "./axiosConfig";

export const getCompanyTripsApi = (params) =>
  api.get("/company/trips", { params });

export const getCompanyTripDetailsApi = (id) =>
  api.get(`/company/trips/${id}`);

export const assignTripDriverApi = (tripId, driverId) =>
  api.patch(`/company/trips/${tripId}/assign-driver`, { driverId });
