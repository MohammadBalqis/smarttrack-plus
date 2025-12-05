import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerDrivers,
  updateManagerDriver,
  toggleManagerDriverStatus,
  getManagerDriverStats,
  getManagerDriverRecentTrips,
} from "../controllers/managerDriverController.js";

const router = Router();

/* ==========================================================
   🚗 GET ALL DRIVERS
========================================================== */
router.get(
  "/drivers",
  protect,
  authorizeRoles("manager", "company"),
  getManagerDrivers
);

/* ==========================================================
   ✏ UPDATE DRIVER
========================================================== */
router.put(
  "/driver/:driverId/edit",
  protect,
  authorizeRoles("manager", "company"),
  updateManagerDriver
);

/* ==========================================================
   🔁 TOGGLE ACTIVE / INACTIVE
========================================================== */
router.put(
  "/driver/:driverId/status",
  protect,
  authorizeRoles("manager", "company"),
  toggleManagerDriverStatus
);

/* ==========================================================
   🏆 DRIVER PERFORMANCE STATS
========================================================== */
router.get(
  "/driver/:driverId/stats",
  protect,
  authorizeRoles("manager", "company"),
  getManagerDriverStats
);

/* ==========================================================
   📜 RECENT TRIPS
========================================================== */
router.get(
  "/driver/:driverId/recent-trips",
  protect,
  authorizeRoles("manager", "company"),
  getManagerDriverRecentTrips
);

export default router;
