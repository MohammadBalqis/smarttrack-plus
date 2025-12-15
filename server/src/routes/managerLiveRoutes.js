// server/src/routes/managerLiveRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerLiveDrivers,
  getManagerLiveTrips,
} from "../controllers/managerLiveController.js";

const router = Router();

/* ==========================================================
   📡 LIVE TRACKING — MANAGER / COMPANY
   Base path: /api/manager/live
========================================================== */

router.get(
  "/drivers",
  protect,
  authorizeRoles("manager", "company"),
  getManagerLiveDrivers
);

router.get(
  "/trips",
  protect,
  authorizeRoles("manager", "company"),
  getManagerLiveTrips
);

export default router;
