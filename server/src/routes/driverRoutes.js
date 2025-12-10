// server/src/routes/driverRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

// Upload middleware
import { uploadDriverImage } from "../middleware/multerConfig.js";

// Driver management controllers
import {
  createDriver,
  getAllDrivers,
} from "../controllers/driverController.js";

// Driver trip controllers (D7.x)
import {
  getDriverActiveTrip,
  updateDriverTripStatus,
  confirmTripByQr,
  acceptTrip,
  declineTrip,
} from "../controllers/driverTripController.js";

// Driver notifications (D8.x)
import {
  getDriverNotifications,
  markAllDriverNotificationsRead,
} from "../controllers/driverNotificationController.js";

// Rate limiter protection
import { driverCreateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = Router();

/* ==========================================================
   🚚 CREATE DRIVER (Company / Manager / Superadmin)
   POST /api/driver/create
========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager", "superadmin"),
  driverCreateLimiter,
  uploadDriverImage.single("profileImage"),
  createDriver
);

/* ==========================================================
   📋 GET ALL DRIVERS
   GET /api/driver/get-all
========================================================== */
router.get(
  "/get-all",
  protect,
  authorizeRoles("company", "manager", "superadmin"),
  getAllDrivers
);

/* ==========================================================
   📌 D7.1 — GET ACTIVE TRIP FOR DRIVER
   GET /api/driver/active-trip
========================================================== */
router.get(
  "/active-trip",
  protect,
  authorizeRoles("driver"),
  getDriverActiveTrip
);

/* ==========================================================
   📌 Accept or Decline Assigned Trips (Optional Feature)
========================================================== */
router.post(
  "/trips/accept",
  protect,
  authorizeRoles("driver"),
  acceptTrip
);

router.post(
  "/trips/decline",
  protect,
  authorizeRoles("driver"),
  declineTrip
);

/* ==========================================================
   📌 D7.2 — UPDATE TRIP STATUS (DRIVER CONTROLS)
   PATCH /api/driver/trips/:tripId/status
========================================================== */
router.patch(
  "/trips/:tripId/status",
  protect,
  authorizeRoles("driver"),
  updateDriverTripStatus
);

/* ==========================================================
   📌 D7.4 — CONFIRM DELIVERY BY SCANNED QR
   POST /api/driver/trips/confirm-qr
========================================================== */
router.post(
  "/trips/confirm-qr",
  protect,
  authorizeRoles("driver"),
  confirmTripByQr
);

/* ==========================================================
   🔔 D8.x — DRIVER NOTIFICATIONS
========================================================== */

// List notifications (supports ?unreadOnly=true)
router.get(
  "/notifications",
  protect,
  authorizeRoles("driver"),
  getDriverNotifications
);

// Mark all as read
router.post(
  "/notifications/read-all",
  protect,
  authorizeRoles("driver"),
  markAllDriverNotificationsRead
);

export default router;
