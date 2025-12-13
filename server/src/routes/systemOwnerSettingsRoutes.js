// server/src/routes/systemOwnerRoutes.js

import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();
const ownerAuth = [protect, authorizeRoles("superadmin", "owner")];

/* DASHBOARD */
import {
  getOwnerOverview,
  getCompaniesActivity,
  getRevenueChart,
} from "../controllers/systemOwner/systemOwnerDashboardController.js";

router.get("/overview", ownerAuth, getOwnerOverview);
router.get("/companies-activity", ownerAuth, getCompaniesActivity);
router.get("/revenue-chart", ownerAuth, getRevenueChart);

/* COMPANIES */
import {
  getCompanyDetails,
  updateCompanySubscription,
  updateCompanyStatus,
  updateCompanyLimits,
  deleteCompany,
} from "../controllers/systemOwner/systemOwnerCompaniesController.js";

router.get("/company/:companyId", ownerAuth, getCompanyDetails);
router.patch("/company/:companyId/subscription", ownerAuth, updateCompanySubscription);
router.patch("/company/:companyId/status", ownerAuth, updateCompanyStatus);
router.patch("/company/:companyId/limits", ownerAuth, updateCompanyLimits);
router.delete("/company/:companyId", ownerAuth, deleteCompany);

export default router;
