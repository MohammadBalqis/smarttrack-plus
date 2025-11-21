// server/src/routes/vehicleRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createVehicle,
  getCompanyVehicles,
  getAvailableVehicles,
  updateVehicle,
  toggleVehicleStatus,
  deleteVehicle,
} from "../controllers/vehicleController.js";

const router = Router();

/* ==========================================================
   🚗 VEHICLE ROUTES
========================================================== */

// Create vehicle
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  createVehicle
);

// Get all vehicles
router.get(
  "/list",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  getCompanyVehicles
);

// Get only available vehicles
router.get(
  "/available",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  getAvailableVehicles
);

// Update vehicle details
router.put(
  "/update/:id",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  updateVehicle
);

// Toggle vehicle status (available <-> maintenance)
router.put(
  "/toggle-status/:id",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  toggleVehicleStatus
);

// Delete vehicle
router.delete(
  "/delete/:id",
  protect,
  authorizeRoles("company", "manager", "superadmin", "owner"),
  deleteVehicle
);

export default router;
