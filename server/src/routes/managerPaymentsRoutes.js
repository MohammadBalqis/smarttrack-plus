// server/src/routes/managerPaymentsRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerPayments,
  getManagerPaymentDetails,
  getManagerPaymentsSummary,
} from "../controllers/managerPaymentsController.js";

const router = Router();

router.get(
  "/payments",
  protect,
  authorizeRoles("manager", "company"),
  getManagerPayments
);

router.get(
  "/payments-summary",
  protect,
  authorizeRoles("manager", "company"),
  getManagerPaymentsSummary
);

router.get(
  "/payments/:paymentId",
  protect,
  authorizeRoles("manager", "company"),
  getManagerPaymentDetails
);

export default router;
