// server/src/routes/systemOwnerDashboardRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getOwnerOverview,
  getCompaniesActivity,
  getRevenueChart,
} from "../controllers/systemOwner/systemOwnerDashboardController.js";


import {
  getOwnerBillingOverview,
  getOwnerInvoices,
  generateCompanyInvoice,
} from "../controllers/systemOwner/systemOwnerBillingController.js";
const router = Router();

/* ==========================================================
   All routes are for SYSTEM OWNER
   Allowed roles: superadmin (and owner if you add it later)
========================================================== */
const ownerAuth = [protect, authorizeRoles("superadmin", "owner")];

/* Overview KPIs */
router.get("/overview", ownerAuth, getOwnerOverview);

/* Companies + subscriptions table */
router.get("/companies-activity", ownerAuth, getCompaniesActivity);

/* Revenue chart (last 14 days) */
router.get("/revenue-chart", ownerAuth, getRevenueChart);

export default router;
import {
  getGeneralSettings,
  updateGeneralSettings,
} from "../controllers/systemOwner/settings/ownerGeneralSettingsController.js";

import {
  getBrandingSettings,
  updateBrandingSettings,
} from "../controllers/systemOwner/settings/ownerBrandingSettingsController.js";

import {
  getBillingSettings,
  updateBillingSettings,
} from "../controllers/systemOwner/settings/ownerBillingSettingsController.js";

import {
  getSecuritySettings,
  updateSecuritySettings,
} from "../controllers/systemOwner/settings/ownerSecuritySettingsController.js";

/* ================= GENERAL ================= */
router.get("/settings/general", ownerAuth, getGeneralSettings);
router.put("/settings/general", ownerAuth, updateGeneralSettings);

/* ================= BRANDING ================= */
router.get("/settings/branding", ownerAuth, getBrandingSettings);
router.put("/settings/branding", ownerAuth, updateBrandingSettings);

/* ================= BILLING ================= */
router.get("/settings/billing", ownerAuth, getBillingSettings);
router.put("/settings/billing", ownerAuth, updateBillingSettings);

/* ================= SECURITY ================= */
router.get("/settings/security", ownerAuth, getSecuritySettings);
router.put("/settings/security", ownerAuth, updateSecuritySettings);
/* ---- Billing overview ---- */
router.get("/billing/overview", ownerAuth, getOwnerBillingOverview);

/* ---- Invoices list ---- */
router.get("/billing/invoices", ownerAuth, getOwnerInvoices);

/* ---- Generate invoice for one company (optional / for later) ---- */
router.post(
  "/billing/invoices/generate/:companyId",
  ownerAuth,
  generateCompanyInvoice
);
