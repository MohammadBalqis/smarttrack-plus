import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

/* DASHBOARD */
import {
  getOwnerOverview,
  getCompaniesActivity,
  getRevenueChart,
} from "../controllers/systemOwner/systemOwnerDashboardController.js";

/* PROFILE */
import {
  getOwnerProfile,
  updateOwnerProfile,
  updateOwnerPassword,
} from "../controllers/systemOwner/systemOwnerProfileController.js";

/* BILLING */
import {
  getOwnerBillingOverview,
  getOwnerInvoices,
  generateCompanyInvoice,
} from "../controllers/systemOwner/systemOwnerBillingController.js";

/* SETTINGS */
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

/* ACTIVITY LOGS */
import { getOwnerActivityLogs } from "../controllers/systemOwnerActivityController.js";

/* COMPANY DETAILS */
import { getCompanyDetails } from "../controllers/systemOwner/systemOwnerCompanyDetailsController.js";

/* COMPANY APPLICATIONS */
import {
  getCompanyApplications,
  getCompanyApplicationById,
  approveCompanyApplication,
  rejectCompanyApplication,
} from "../controllers/systemOwner/companyApprovalController.js";

const router = Router();

const ownerAuth = [protect, authorizeRoles("superadmin", "owner")];

/* DASHBOARD */
router.get("/overview", ownerAuth, getOwnerOverview);
router.get("/companies-activity", ownerAuth, getCompaniesActivity);
router.get("/revenue-chart", ownerAuth, getRevenueChart);

/* COMPANY DETAILS */
router.get("/company/:companyId", ownerAuth, getCompanyDetails);

/* SETTINGS */
router.get("/settings/general", ownerAuth, getGeneralSettings);
router.put("/settings/general", ownerAuth, updateGeneralSettings);

router.get("/settings/branding", ownerAuth, getBrandingSettings);
router.put("/settings/branding", ownerAuth, updateBrandingSettings);

router.get("/settings/billing", ownerAuth, getBillingSettings);
router.put("/settings/billing", ownerAuth, updateBillingSettings);

router.get("/settings/security", ownerAuth, getSecuritySettings);
router.put("/settings/security", ownerAuth, updateSecuritySettings);

/* BILLING */
router.get("/billing/overview", ownerAuth, getOwnerBillingOverview);
router.get("/billing/invoices", ownerAuth, getOwnerInvoices);
router.post("/billing/invoices/generate/:companyId", ownerAuth, generateCompanyInvoice);

/* PROFILE */
router.get("/profile", ownerAuth, getOwnerProfile);
router.put("/profile", ownerAuth, updateOwnerProfile);
router.put("/profile/password", ownerAuth, updateOwnerPassword);

/* ACTIVITY LOGS (SUPERADMIN ONLY) */
router.get("/activity-logs", protect, authorizeRoles("superadmin"), getOwnerActivityLogs);

/* COMPANY APPLICATIONS */
router.get("/company-applications", ownerAuth, getCompanyApplications);
router.get("/company-applications/:id", ownerAuth, getCompanyApplicationById);
router.patch("/company-applications/:id/approve", ownerAuth, approveCompanyApplication);
router.patch("/company-applications/:id/reject", ownerAuth, rejectCompanyApplication);

export default router;
