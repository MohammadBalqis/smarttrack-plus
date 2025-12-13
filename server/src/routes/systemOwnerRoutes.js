import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();
const ownerAuth = [protect, authorizeRoles("superadmin", "owner")];

/* ==========================================================
   DASHBOARD
========================================================== */
import {
  getOwnerOverview,
  getCompaniesActivity,
  getRevenueChart,
} from "../controllers/systemOwner/systemOwnerDashboardController.js";

router.get("/overview", ownerAuth, getOwnerOverview);
router.get("/companies-activity", ownerAuth, getCompaniesActivity);
router.get("/revenue-chart", ownerAuth, getRevenueChart);

/* ==========================================================
   COMPANY MANAGEMENT
========================================================== */
import {
  getCompanyDetails,
  updateCompanySubscription,
  updateCompanyStatus,
  updateCompanyLimits,
  deleteCompany, // suspend
  permanentlyDeleteCompany, // 🔥 HARD DELETE
} from "../controllers/systemOwner/systemOwnerCompaniesController.js";

router.get("/company/:companyId", ownerAuth, getCompanyDetails);

router.patch(
  "/company/:companyId/subscription",
  ownerAuth,
  updateCompanySubscription
);

router.patch(
  "/company/:companyId/status",
  ownerAuth,
  updateCompanyStatus
);

router.patch(
  "/company/:companyId/limits",
  ownerAuth,
  updateCompanyLimits
);

/* 🟡 SOFT DELETE (Suspend) */
router.delete(
  "/company/:companyId",
  ownerAuth,
  deleteCompany
);

/* 🔥 HARD DELETE (Permanent) */
router.delete(
  "/company/:companyId/permanent",
  ownerAuth,
  permanentlyDeleteCompany
);

/* ==========================================================
   COMPANY APPLICATIONS
========================================================== */
import {
  getCompanyApplications,
  approveCompanyApplication,
  rejectCompanyApplication,
} from "../controllers/systemOwner/companyApprovalController.js";

router.get("/company-applications", ownerAuth, getCompanyApplications);

router.patch(
  "/company-applications/:id/approve",
  ownerAuth,
  approveCompanyApplication
);

router.patch(
  "/company-applications/:id/reject",
  ownerAuth,
  rejectCompanyApplication
);

/* ==========================================================
   BILLING
========================================================== */
import {
  getOwnerBillingOverview,
  getOwnerInvoices,
  generateCompanyInvoice,
} from "../controllers/systemOwner/systemOwnerBillingController.js";

router.get("/billing/overview", ownerAuth, getOwnerBillingOverview);
router.get("/billing/invoices", ownerAuth, getOwnerInvoices);
router.post(
  "/billing/invoices/generate/:companyId",
  ownerAuth,
  generateCompanyInvoice
);

/* ==========================================================
   SETTINGS
========================================================== */
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

router.get("/settings/general", ownerAuth, getGeneralSettings);
router.put("/settings/general", ownerAuth, updateGeneralSettings);

router.get("/settings/branding", ownerAuth, getBrandingSettings);
router.put("/settings/branding", ownerAuth, updateBrandingSettings);

router.get("/settings/billing", ownerAuth, getBillingSettings);
router.put("/settings/billing", ownerAuth, updateBillingSettings);

router.get("/settings/security", ownerAuth, getSecuritySettings);
router.put("/settings/security", updateSecuritySettings);

/* ==========================================================
   PROFILE
========================================================== */
import {
  getOwnerProfile,
  updateOwnerProfile,
  updateOwnerPassword,
} from "../controllers/systemOwner/systemOwnerProfileController.js";

router.get("/profile", ownerAuth, getOwnerProfile);
router.put("/profile", ownerAuth, updateOwnerProfile);
router.put("/profile/password", ownerAuth, updateOwnerPassword);

/* ==========================================================
   ACTIVITY LOGS (SUPERADMIN ONLY)
========================================================== */
import { getOwnerActivityLogs } from "../controllers/systemOwnerActivityController.js";

router.get(
  "/activity-logs",
  protect,
  authorizeRoles("superadmin"),
  getOwnerActivityLogs
);

export default router;
