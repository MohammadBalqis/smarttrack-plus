import apiClient from "./apiClient";

// List all active companies
export const getCustomerCompaniesApi = () =>
  apiClient.get("/customer-companies/companies");

// Select a company
export const selectCompanyApi = (companyId) =>
  apiClient.post("/customer-companies/select-company", { companyId });
