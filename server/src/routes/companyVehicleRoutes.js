// server/src/routes/companyVehicleRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getCompanyVehicles,
  updateCompanyVehicleStatus,
  getCompanyVehicleTrips,
} from "../controllers/companyVehicleController.js";

const router = Router();

/* ==========================================================
   🚗 LIST VEHICLES (Company + Manager)
   GET /api/company/vehicles
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyVehicles
);

/* ==========================================================
   🔄 UPDATE VEHICLE STATUS
   PUT /api/company/vehicles/:id/status
========================================================== */
router.put(
  "/:id/status",
  protect,
  authorizeRoles("company", "manager"),
  updateCompanyVehicleStatus
);

/* ==========================================================
   📜 VEHICLE TRIP HISTORY
   GET /api/company/vehicles/:id/trips
========================================================== */
router.get(
  "/:id/trips",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyVehicleTrips
);

export default router;
