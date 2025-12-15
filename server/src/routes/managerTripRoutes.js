// server/src/routes/managerTripRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerTrips,
  getManagerTripDetails,
  getManagerTripTimeline,
  getManagerTripStats,
} from "../controllers/managerTripController.js";

const router = Router();

/* ==========================================================
   📦 LIST TRIPS (manager/company)
   GET /api/manager/trips
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("manager", "company"),
  getManagerTrips
);

/* ==========================================================
   📊 KPI STATS FOR CARDS
   GET /api/manager/trips/stats
========================================================== */
router.get(
  "/stats",
  protect,
  authorizeRoles("manager", "company"),
  getManagerTripStats
);

/* ==========================================================
   🔎 SINGLE TRIP DETAILS
   GET /api/manager/trips/:id
========================================================== */
router.get(
  "/:id",
  protect,
  authorizeRoles("manager", "company"),
  getManagerTripDetails
);

/* ==========================================================
   📝 TRIP TIMELINE
   GET /api/manager/trips/:id/timeline
========================================================== */
router.get(
  "/:id/timeline",
  protect,
  authorizeRoles("manager", "company"),
  getManagerTripTimeline
);

export default router;
