import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerOrders,
  getManagerOrderDetails,
  getManagerOrderTimeline,
  getManagerOrdersSummary,

  // ➕ NEW (flow completion)
  getAvailableDriversForOrders,
  assignDriverToOrder,
  generateOrderDeliveryQr,
  verifyOrderDeliveryQr,
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

/* ==========================================================
   🚗 AVAILABLE DRIVERS (NOT ON TRIP)
   Used before assignment
========================================================== */
router.get(
  "/orders/available-drivers",
  protect,
  authorizeRoles("manager", "company"),
  getAvailableDriversForOrders
);

/* ==========================================================
   📤 ASSIGN DRIVER TO ORDER
   body: { driverId }
========================================================== */
router.patch(
  "/orders/:orderId/assign-driver",
  protect,
  authorizeRoles("manager", "company"),
  assignDriverToOrder
);

/* ==========================================================
   🔳 GENERATE DELIVERY QR (Manager)
========================================================== */
router.post(
  "/orders/:orderId/generate-qr",
  protect,
  authorizeRoles("manager", "company"),
  generateOrderDeliveryQr
);

/* ==========================================================
   ✅ VERIFY DELIVERY QR (Proof of Delivery)
   body: { token }
========================================================== */
router.post(
  "/orders/:orderId/verify-qr",
  protect,
  authorizeRoles("manager", "company"),
  verifyOrderDeliveryQr
);

export default router;
