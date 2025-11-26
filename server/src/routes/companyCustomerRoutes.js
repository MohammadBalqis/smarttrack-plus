// server/src/routes/companyCustomerRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getCompanyCustomers,
  getCompanyCustomerStats,
  getCompanyCustomerOrders,
  toggleCompanyCustomerStatus,
} from "../controllers/companyCustomerController.js";

const router = Router();

/* List all customers of this company (with summary stats) */
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyCustomers
);

/* Stats for a single customer in this company */
router.get(
  "/:id/stats",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyCustomerStats
);

/* Orders list for a single customer in this company */
router.get(
  "/:id/orders",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyCustomerOrders
);

/* Toggle active / inactive */
router.patch(
  "/:id/toggle-active",
  protect,
  authorizeRoles("company"),
  toggleCompanyCustomerStatus
);

export default router;
