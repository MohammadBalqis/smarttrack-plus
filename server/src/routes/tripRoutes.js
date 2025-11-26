import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { qrLimiter } from "../middleware/rateLimitMiddleware.js";
import { safeHandler } from "../utils/safeHandler.js";

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
   🚚 TRIP ROUTES (SECURED + WRAPPED)
========================================================== */

// 1. Create trip
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  safeHandler(createTrip)
);

// 1B. Assign driver + vehicle
router.post(
  "/assign",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  safeHandler(assignTrip)
);

// 2. Update driver location
router.post(
  "/update-location",
  protect,
  authorizeRoles("driver"),
  safeHandler(updateDriverLocation)
);

// 3. Complete trip
router.post(
  "/complete",
  protect,
  authorizeRoles("driver", "manager", "company", "superadmin", "owner"),
  safeHandler(completeTrip)
);

// 4. Driver active trips
router.get(
  "/active",
  protect,
  authorizeRoles("driver"),
  safeHandler(getDriverActiveTrips)
);

// 5. Route history
router.get(
  "/:tripId/route",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  safeHandler(getRouteHistory)
);

// 6. List trips
router.get(
  "/list",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  safeHandler(listTrips)
);

// 7. Generate QR
router.get(
  "/:tripId/generate-qr",
  protect,
  authorizeRoles("company", "manager", "driver", "superadmin", "owner"),
  safeHandler(generateTripQr)
);

// 8. Confirm delivery (rate-limited)
router.post(
  "/confirm-delivery",
  qrLimiter,
  safeHandler(confirmDelivery)
);

// 9. Customer live tracking
router.get(
  "/customer/live/:tripId",
  protect,
  authorizeRoles("customer"),
  safeHandler(getCustomerLiveTrip)
);

// Manager search
router.get(
  "/manager/search",
  protect,
  authorizeRoles("manager", "company", "owner", "superadmin"),
  safeHandler(managerSearchTrips)
);

// Cancel trip
router.patch(
  "/cancel/:tripId",
  protect,
  authorizeRoles("manager", "company", "owner", "superadmin"),
  safeHandler(cancelTrip)
);

// Update trip
router.patch(
  "/update/:tripId",
  protect,
  authorizeRoles("manager", "company", "owner", "superadmin"),
  safeHandler(updateTrip)
);

// Live status updates
router.post(
  "/live-status",
  protect,
  authorizeRoles("driver"),
  safeHandler(updateLiveStatus)
);

export default router;
