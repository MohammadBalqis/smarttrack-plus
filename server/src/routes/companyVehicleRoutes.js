// server/src/routes/companyVehicleRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getCompanyVehicles,
  createCompanyVehicle,
  updateCompanyVehicle,
  assignCompanyVehicleDriver,
  updateCompanyVehicleStatus,
  getCompanyVehicleTrips,
} from "../controllers/companyVehicleController.js";

const router = Router();

/* ==========================================================
   🚗 LIST VEHICLES (Company + Manager)
   GET /api/company/vehicles
========================================================== */
router.get(
  "/vehicles",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyVehicles
);

/* ==========================================================
   ➕ CREATE VEHICLE (Company ONLY)
   POST /api/company/vehicles
========================================================== */
router.post(
  "/vehicles",
  protect,
  authorizeRoles("company"),
  createCompanyVehicle
);

/* ==========================================================
   ✏ UPDATE VEHICLE (Company ONLY)
   PUT /api/company/vehicles/:id
========================================================== */
router.put(
  "/vehicles/:id",
  protect,
  authorizeRoles("company"),
  updateCompanyVehicle
);

/* ==========================================================
   👨‍🔧 ASSIGN / REMOVE DRIVER (Company + Manager)
   PUT /api/company/vehicles/:id/assign-driver
========================================================== */
router.put(
  "/vehicles/:id/assign-driver",
  protect,
  authorizeRoles("company", "manager"),
  assignCompanyVehicleDriver
);

/* ==========================================================
   🔄 UPDATE STATUS (Company + Manager)
   PUT /api/company/vehicles/:id/status
========================================================== */
router.put(
  "/vehicles/:id/status",
  protect,
  authorizeRoles("company", "manager"),
  updateCompanyVehicleStatus
);

/* ==========================================================
   📜 TRIP HISTORY (Company + Manager)
   GET /api/company/vehicles/:id/trips
========================================================== */
router.get(
  "/vehicles/:id/trips",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyVehicleTrips
);

export default router;
