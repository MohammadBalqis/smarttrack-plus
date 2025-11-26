import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { safeHandler } from "../utils/safeHandler.js";

import {
  getCompanyPayments,
  getDriverPayments,
  getCustomerPayments,
  getPaymentDetails,
  getCompanyPaymentsSummary,
  createPayment,
  refundPayment
} from "../controllers/paymentController.js";

const router = Router();

/* ==========================================================
   💳 PAYMENT ROUTES (SECURED + WRAPPED)
========================================================== */

// 🔐 Create payment (manual or auto)
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  safeHandler(createPayment)
);

// 🔙 Refund Payment
router.post(
  "/refund/:id",
  protect,
  authorizeRoles("owner", "superadmin"),
  safeHandler(refundPayment)
);

// 📊 Company + Manager Payments
router.get(
  "/company",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  safeHandler(getCompanyPayments)
);

// 🚗 Driver payments
router.get(
  "/driver",
  protect,
  authorizeRoles("driver", "manager", "company", "owner", "superadmin"),
  safeHandler(getDriverPayments)
);

// 👤 Customer payments
router.get(
  "/customer",
  protect,
  authorizeRoles("customer"),
  safeHandler(getCustomerPayments)
);

// 🔎 Payment details
router.get(
  "/details/:id",
  protect,
  authorizeRoles(
    "company",
    "manager",
    "driver",
    "customer",
    "owner",
    "superadmin"
  ),
  safeHandler(getPaymentDetails)
);

// 📊 Dashboard summary
router.get(
  "/summary/company",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  safeHandler(getCompanyPaymentsSummary)
);

export default router;
