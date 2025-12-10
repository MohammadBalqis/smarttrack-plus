// server/src/routes/driverTripRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getDriverTrips,
  getDriverActiveTrip,
  updateDriverTripStatus,
  confirmTripByQr,
  acceptTrip,
  declineTrip,
  saveDriverLocationPoint, // ⬅ NEW IMPORT
} from "../controllers/driverTripController.js";

const router = Router();

/* ==========================================================
   📋 LIST TRIPS
   GET /api/driver/trips
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("driver"),
  getDriverTrips
);

/* ==========================================================
   📌 ACTIVE TRIP
   GET /api/driver/trips/active
========================================================== */
router.get(
  "/active",
  protect,
  authorizeRoles("driver"),
  getDriverActiveTrip
);

/* ==========================================================
   🔄 UPDATE TRIP STATUS
   PATCH /api/driver/trips/:tripId/status
========================================================== */
router.patch(
  "/:tripId/status",
  protect,
  authorizeRoles("driver"),
  updateDriverTripStatus
);

/* ==========================================================
   🟦 CONFIRM BY QR
   POST /api/driver/trips/confirm-qr
========================================================== */
router.post(
  "/confirm-qr",
  protect,
  authorizeRoles("driver"),
  confirmTripByQr
);

/* ==========================================================
   🟢 ACCEPT TRIP
========================================================== */
router.post(
  "/accept",
  protect,
  authorizeRoles("driver"),
  acceptTrip
);

/* ==========================================================
   🔴 DECLINE TRIP
========================================================== */
router.post(
  "/decline",
  protect,
  authorizeRoles("driver"),
  declineTrip
);

/* ==========================================================
   🛰 SAVE DRIVER LOCATION POINT
   PUT /api/driver/trips/:tripId/location
========================================================== */
router.put(
  "/:tripId/location",
  protect,
  authorizeRoles("driver"),
  saveDriverLocationPoint
);

export default router;
