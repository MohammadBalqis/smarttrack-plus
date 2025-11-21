// server/src/routes/paymentRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getCompanyPayments,
  getDriverPayments,
  getCustomerPayments,
  getPaymentDetails,
  getCompanyPaymentsSummary,
} from "../controllers/paymentController.js";

const router = Router();

/* ==========================================================
   💳 PAYMENT ROUTES
========================================================== */

// company / manager payments
router.get(
  "/company",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  getCompanyPayments
);

// driver payments
router.get(
  "/driver",
  protect,
  authorizeRoles("driver", "manager", "company", "owner", "superadmin"),
  getDriverPayments
);

// customer payments
router.get(
  "/customer",
  protect,
  authorizeRoles("customer"),
  getCustomerPayments
);

// single payment details
router.get(
  "/details/:id",
  protect,
  authorizeRoles("company", "manager", "driver", "customer", "owner", "superadmin"),
  getPaymentDetails
);

// company payment summary
router.get(
  "/summary/company",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  getCompanyPaymentsSummary
);

export default router;
