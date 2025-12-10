// client/src/api/ownerApi.js
import api from "./apiClient";

/* ==========================================================
   SO.1 — DASHBOARD OVERVIEW + ACTIVITY + REVENUE CHART
========================================================== */

// KPIs for system owner dashboard
export const getOwnerOverviewApi = () =>
  api.get("/owner/overview");

// Companies activity + subscription snapshot
export const getOwnerCompaniesActivityApi = () =>
  api.get("/owner/companies-activity");

// Revenue chart (last 14 days)
export const getOwnerRevenueChartApi = () =>
  api.get("/owner/revenue-chart");

/* ==========================================================
   SO.3 — COMPANIES PAGE (you can reuse companies-activity)
========================================================== */

// If you have a dedicated endpoint later, you can add it here.
// For now we reuse getOwnerCompaniesActivityApi in both pages.

/* ==========================================================
   SO.4 / SO.5 — BILLING & INVOICES
========================================================== */

// Billing overview KPIs
export const getOwnerBillingOverviewApi = () =>
  api.get("/owner/billing/overview");

// Invoices list with filters
// params: { status?, companyId? }
export const getOwnerInvoicesApi = (params = {}) =>
  api.get("/owner/billing/invoices", { params });

// (Optional) Generate invoice for one company
export const generateOwnerCompanyInvoiceApi = (companyId) =>
  api.post(`/owner/billing/invoices/generate/${companyId}`);

export const getOwnerInvoiceByIdApi = (invoiceId) =>
  api.get(`/owner/billing/invoices/${invoiceId}`);
// Mark invoice as paid
export const markInvoicePaidApi = (invoiceId) =>
  api.patch(`/owner/billing/invoices/${invoiceId}/mark-paid`);


// SO.8 — Owner settings
export const getOwnerSettingsApi = () => api.get("/owner/settings");

export const updateOwnerSettingsApi = (data) =>
  api.put("/owner/settings", data);

