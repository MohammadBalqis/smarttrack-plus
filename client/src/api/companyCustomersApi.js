// client/src/api/companyCustomersApi.js
import api from "./axiosConfig";

// 1️⃣ Get all customers who ordered from this company
export const getCompanyCustomersApi = () =>
  api.get("/company/customers");

// 2️⃣ Get stats for one customer
export const getCompanyCustomerStatsApi = (customerId) =>
  api.get(`/company/customers/${customerId}/stats`);

// 3️⃣ Get recent trips for one customer
export const getCompanyCustomerRecentTripsApi = (customerId) =>
  api.get(`/company/customers/${customerId}/recent-trips`);
