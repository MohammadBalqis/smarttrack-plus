// server/src/routes/systemOwnerBillingRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  runBillingCycleController,
  markPastDueController,
  getOwnerInvoices,
} from "../controllers/systemOwner/systemOwnerBillingController.js";

const router = Router();

const ownerAuth = [protect, authorizeRoles("superadmin", "owner")];

router.post("/billing/run-cycle", ownerAuth, runBillingCycleController);
router.post("/billing/mark-past-due", ownerAuth, markPastDueController);
router.get("/billing/invoices", ownerAuth, getOwnerInvoices);

export default router;
