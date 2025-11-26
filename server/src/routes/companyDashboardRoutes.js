// server/src/routes/companyDashboardRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getCompanyDashboardStats,
  getCompanyDashboardRecentTrips,
  getCompanyDashboardRecentOrders,
  getCompanyDashboardRecentPayments,
} from "../controllers/companyDashboardController.js";

const router = Router();

router.get(
  "/stats",
  protect,
  authorizeRoles("company"),
  getCompanyDashboardStats
);

router.get(
  "/recent-trips",
  protect,
  authorizeRoles("company"),
  getCompanyDashboardRecentTrips
);

router.get(
  "/recent-orders",
  protect,
  authorizeRoles("company"),
  getCompanyDashboardRecentOrders
);

router.get(
  "/recent-payments",
  protect,
  authorizeRoles("company"),
  getCompanyDashboardRecentPayments
);

export default router;
