// server/src/routes/companyCustomerRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getCompanyCustomers,
  getCompanyCustomerStats,
  getCompanyCustomerRecentTrips,
} from "../controllers/companyCustomerController.js";

const router = Router();

/* ==========================================================
   👥 COMPANY CUSTOMERS (Company / Manager)
   ========================================================== */

// List customers who made trips with this company
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyCustomers
);

// Customer stats (for this company)
router.get(
  "/:id/stats",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyCustomerStats
);

// Customer recent trips
router.get(
  "/:id/recent-trips",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyCustomerRecentTrips
);

export default router;
