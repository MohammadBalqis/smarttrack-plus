import api from "./axiosConfig";

// GET all companies
export const getAllCompaniesApi = () => api.get("/admin/companies");

// CREATE a new company
export const createCompanyApi = (data) => api.post("/admin/companies", data);

// GET single company details
export const getCompanyByIdApi = (id) => api.get(`/admin/companies/${id}`);

// UPDATE company details
export const updateCompanyApi = (id, data) =>
  api.put(`/admin/companies/${id}`, data);

// SUSPEND company
export const suspendCompanyApi = (id) =>
  api.patch(`/admin/companies/${id}/suspend`);

// ACTIVATE company
export const activateCompanyApi = (id) =>
  api.patch(`/admin/companies/${id}/activate`);
