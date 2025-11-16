// server/src/routes/superAdminTripRoutes.js

import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeSuperAdmin } from "../middleware/superAdminMiddleware.js";

import {
  superAdminListTrips,
  superAdminGetSingleTrip
} from "../controllers/superAdminTripController.js";

const router = Router();

// Only superadmin allowed
const onlySuperAdmin = [protect, authorizeSuperAdmin];

/* ==========================================================
   📌 LIST ALL TRIPS (READ ONLY)
   GET /api/superadmin/trips
========================================================== */
router.get("/", onlySuperAdmin, superAdminListTrips);

/* ==========================================================
   📌 GET SINGLE TRIP DETAILS (READ ONLY)
   GET /api/superadmin/trips/:tripId
========================================================== */
router.get("/:tripId", onlySuperAdmin, superAdminGetSingleTrip);

export default router;
