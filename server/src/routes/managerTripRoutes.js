// server/src/routes/managerTripRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerTrips,
  getManagerTripDetails,
  getManagerTripTimeline,
  getManagerTripSummary,
} from "../controllers/managerTripController.js";

const router = Router();

// manager & company
router.use(protect, authorizeRoles("manager", "company"));

// GET all trips
router.get("/", getManagerTrips);

// single trip details
router.get("/:id", getManagerTripDetails);

// timeline
router.get("/:id/timeline", getManagerTripTimeline);

// summary
router.get("/summary/data", getManagerTripSummary);

export default router;
