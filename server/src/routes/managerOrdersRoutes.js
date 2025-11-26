// server/src/routes/managerOrderRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerOrders,
  getManagerOrderDetails,
  getManagerOrderTimeline,
  getManagerOrdersSummary,
} from "../controllers/managerOrdersController.js";

const router = Router();

/* ==========================================================
   📦 GET ALL ORDERS (manager/company)
   Filters supported:
   - status=pending,delivered
   - date range (startDate, endDate)
   - minTotal / maxTotal
   - search
   - pagination (page, limit)
========================================================== */
router.get(
  "/orders",
  protect,
  authorizeRoles("manager", "company"),
  getManagerOrders
);

/* ==========================================================
   🔎 GET FULL ORDER DETAILS
========================================================== */
router.get(
  "/orders/:orderId",
  protect,
  authorizeRoles("manager", "company"),
  getManagerOrderDetails
);

/* ==========================================================
   📝 TIMELINE (READ-ONLY)
========================================================== */
router.get(
  "/orders/:orderId/timeline",
  protect,
  authorizeRoles("manager", "company"),
  getManagerOrderTimeline
);

/* ==========================================================
   📊 ORDER SUMMARY (Dashboard stats)
========================================================== */
router.get(
  "/orders-summary",
  protect,
  authorizeRoles("manager", "company"),
  getManagerOrdersSummary
);

export default router;
