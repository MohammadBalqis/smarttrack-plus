// server/src/routes/productAnalyticsRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getProductAnalytics,
  getLowStockProducts,
} from "../controllers/productAnalyticsController.js";

const router = Router();

/* ==========================================================
   🔐 AUTH
========================================================== */
router.use(protect, authorizeRoles("company", "manager"));

/* ==========================================================
   📊 PRODUCT ANALYTICS
   GET /api/company/products/analytics
========================================================== */
router.get("/products/analytics", getProductAnalytics);

/* ==========================================================
   📉 LOW STOCK ALERTS
   GET /api/company/products/low-stock
========================================================== */
router.get("/products/low-stock", getLowStockProducts);

export default router;
