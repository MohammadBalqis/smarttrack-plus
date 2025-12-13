import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getCompanyApplications,
  approveCompanyApplication,
  rejectCompanyApplication,
} from "../controllers/systemOwner/companyApprovalController.js";

const router = Router();

router.use(protect, authorizeRoles("superadmin"));

router.get("/", getCompanyApplications);
router.post("/:id/approve", approveCompanyApplication);
router.post("/:id/reject", rejectCompanyApplication);

export default router;
