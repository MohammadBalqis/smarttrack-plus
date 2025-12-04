import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerLiveDrivers,
  getManagerLiveTrips,
} from "../controllers/managerLiveController.js";

const router = Router();

router.get(
  "/manager/live/drivers",
  protect,
  authorizeRoles("manager", "company"),
  getManagerLiveDrivers
);

router.get(
  "/manager/live/trips",
  protect,
  authorizeRoles("manager", "company"),
  getManagerLiveTrips
);

export default router;
