// server/src/routes/managerTripRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

// From your existing core controller:
import { managerSearchTrips } from "../controllers/trip/tripCoreController.js";
// New stats controller:
import { getManagerTripStats } from "../controllers/trip/tripManagerController.js";

const router = Router();

/* ==========================================================
   📋 MANAGER TRIPS LIST (with filters + pagination)
   Only trips for the company he works in (handled in controller)
========================================================== */
router.get(
  "/trips",
  protect,
  authorizeRoles("manager", "company"),
  managerSearchTrips
);

/* ==========================================================
   📊 MANAGER TRIPS STATS
   Only for his company (see getManagerTripStats)
========================================================== */
router.get(
  "/trips/stats",
  protect,
  authorizeRoles("manager", "company"),
  getManagerTripStats
);

export default router;
