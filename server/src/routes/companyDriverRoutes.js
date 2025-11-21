import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getCompanyDrivers,
  createCompanyDriver,
  updateCompanyDriver,
  toggleCompanyDriverStatus,
  getCompanyDriverStats,
  getCompanyDriverRecentTrips,
} from "../controllers/companyDriverController.js";

const router = Router();

/* ==========================================================
   🚚 COMPANY DRIVERS (Company / Manager)
   ========================================================== */

// List drivers (with optional ?status=active/inactive)
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyDrivers
);

// Driver stats
router.get(
  "/:id/stats",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyDriverStats
);

// Driver recent trips
router.get(
  "/:id/recent-trips",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyDriverRecentTrips
);

// Create driver (Company/Manager)
router.post(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  createCompanyDriver
);

// Update driver
router.put(
  "/:id",
  protect,
  authorizeRoles("company", "manager"),
  updateCompanyDriver
);

// Toggle active status
router.patch(
  "/:id/toggle-active",
  protect,
  authorizeRoles("company", "manager"),
  toggleCompanyDriverStatus
);

export default router;
