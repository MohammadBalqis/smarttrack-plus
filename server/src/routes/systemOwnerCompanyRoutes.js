// server/src/routes/systemOwnerCompanyRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getCompanyDetails,
  updateCompanySubscription,
  updateCompanyStatus,
  updateCompanyLimits,
  deleteCompany,
} from "../controllers/systemOwner/systemOwnerCompaniesController.js";

const router = Router();

/* All routes require owner / superadmin */
const ownerAuth = [protect, authorizeRoles("superadmin", "owner")];

/* Company details + stats */
router.get("/:companyId", ownerAuth, getCompanyDetails);

/* Subscription: plan + billing status */
router.patch(
  "//:companyId/subscription",
  ownerAuth,
  updateCompanySubscription
);

/* Active / suspended toggle */
router.patch("/:companyId/status", ownerAuth, updateCompanyStatus);

/* Limits (drivers, managers, vehicles, shops) */
router.patch("/:companyId/limits", ownerAuth, updateCompanyLimits);

/* Soft delete */
router.delete("/:companyId", ownerAuth, deleteCompany);

export default router;
