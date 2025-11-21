// server/src/routes/companyVehicleRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getCompanyVehicles } from "../controllers/companyVehicleController.js";

const router = Router();

/* ==========================================================
   🚘 COMPANY VEHICLES
   Company + Manager can view all company vehicles
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyVehicles
);

export default router;
