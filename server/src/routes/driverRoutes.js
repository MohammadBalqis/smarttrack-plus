// server/src/routes/driverRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

// Upload middleware (NEW FILE you added in 10H)
import { uploadDriverImage } from "../middleware/multerConfig.js";

// Controller functions
import {
  createDriver,
  getAllDrivers,
} from "../controllers/driverController.js";

// Rate limiter protection
import { driverCreateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = Router();

/* ==========================================================
   🚚 CREATE DRIVER (Company / Manager / Superadmin)
   POST /api/drivers/create
========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager", "superadmin"),
  driverCreateLimiter,
  uploadDriverImage.single("profileImage"),
  createDriver
);

/* ==========================================================
   📋 GET ALL DRIVERS
   GET /api/drivers/get-all
========================================================== */
router.get(
  "/get-all",
  protect,
  authorizeRoles("company", "manager", "superadmin"),
  getAllDrivers
);

export default router;
