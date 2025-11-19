// server/src/routes/tripRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { qrLimiter } from "../middleware/rateLimitMiddleware.js";

// Core controllers
import {
  createTrip,
  assignTrip,
  completeTrip,
  listTrips,
  managerSearchTrips,
  cancelTrip,
  updateTrip,
} from "../controllers/trip/tripCoreController.js";

// Tracking controllers
import {
  updateDriverLocation,
  getDriverActiveTrips,
  getRouteHistory,
  getCustomerLiveTrip,
  updateLiveStatus,
} from "../controllers/trip/tripTrackingController.js";

// QR controllers
import {
  generateTripQr,
  confirmDelivery,
} from "../controllers/trip/tripQrController.js";

const router = Router();

/* ==========================================================
   TRIP ROUTES
========================================================== */

// 1. Create trip
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  createTrip
);

// 1B. Assign driver + vehicle
router.post(
  "/assign",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  assignTrip
);

// 2. Update driver location
router.post(
  "/update-location",
  protect,
  authorizeRoles("driver"),
  updateDriverLocation
);

// 3. Complete trip
router.post(
  "/complete",
  protect,
  authorizeRoles("driver", "manager", "company", "superadmin", "owner"),
  completeTrip
);

// 4. Driver active trips
router.get(
  "/active",
  protect,
  authorizeRoles("driver"),
  getDriverActiveTrips
);

// 5. Route history
router.get(
  "/:tripId/route",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  getRouteHistory
);

// 6. List trips
router.get(
  "/list",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  listTrips
);

// 7. Generate QR
router.get(
  "/:tripId/generate-qr",
  protect,
  authorizeRoles("company", "manager", "driver", "superadmin", "owner"),
  generateTripQr
);

// 8. Confirm delivery — secured with rate limiter
router.post("/confirm-delivery", qrLimiter, confirmDelivery);

// 9. Customer live tracking
router.get(
  "/customer/live/:tripId",
  protect,
  authorizeRoles("customer"),
  getCustomerLiveTrip
);

// Manager search
router.get(
  "/manager/search",
  protect,
  authorizeRoles("manager", "company", "owner", "superadmin"),
  managerSearchTrips
);

// Cancel
router.patch(
  "/cancel/:tripId",
  protect,
  authorizeRoles("manager", "company", "owner", "superadmin"),
  cancelTrip
);

// Update
router.patch(
  "/update/:tripId",
  protect,
  authorizeRoles("manager", "company", "owner", "superadmin"),
  updateTrip
);

// Live status
router.post(
  "/live-status",
  protect,
  authorizeRoles("driver"),
  updateLiveStatus
);

export default router;
