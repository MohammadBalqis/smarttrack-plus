// server/src/routes/companyTripsRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getCompanyTrips,
  getCompanyTripDetails,
  assignTripDriver,
} from "../controllers/companyTripsController.js";

const router = Router();

// List trips
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyTrips
);

// Trip details
router.get(
  "/:id",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyTripDetails
);

// Assign / reassign driver
router.patch(
  "/:id/assign-driver",
  protect,
  authorizeRoles("company", "manager"),
  assignTripDriver
);

export default router;
