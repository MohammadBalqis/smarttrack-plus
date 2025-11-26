// server/src/routes/companyOrderRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getCompanyOrders,
  getCompanyOrderDetails,
  updateCompanyOrderStatus,
  getCompanyOrdersStats,
} from "../controllers/companyOrderController.js";

const router = Router();

/* ==========================================================
   📦 GET ALL COMPANY ORDERS (list + filters + pagination)
   GET /api/company/orders
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyOrders
);

/* ==========================================================
   📊 HIGH-LEVEL STATS FOR DASHBOARD
   GET /api/company/orders/stats
========================================================== */
router.get(
  "/stats",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyOrdersStats
);

/* ==========================================================
   🔍 GET SINGLE ORDER DETAILS
   GET /api/company/orders/:id
========================================================== */
router.get(
  "/:id",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyOrderDetails
);

/* ==========================================================
   📝 MANUAL STATUS UPDATE (EARLY PHASE ONLY)
   PATCH /api/company/orders/:id/status
========================================================== */
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("company", "manager"),
  updateCompanyOrderStatus
);

export default router;
