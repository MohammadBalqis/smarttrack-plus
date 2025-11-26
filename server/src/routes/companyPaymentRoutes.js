// server/src/routes/companyPaymentRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getCompanyPayments,
  getCompanyPaymentDetails,
  getCompanyPaymentsStats,
} from "../controllers/companyPaymentController.js";

const router = Router();

router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyPayments
);

router.get(
  "/stats",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyPaymentsStats
);

router.get(
  "/:id",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyPaymentDetails
);

export default router;
