// server/src/routes/brandingRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getCompanyBranding,
  updateCompanyBranding,
} from "../controllers/brandingController.js";

const router = Router();

/* ==========================================================
   📌 Company Branding Routes
   Base path (already in server.js):
   app.use("/api/company/branding", brandingRoutes);
========================================================== */

// Get branding (company + manager can view)
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyBranding
);

// Update branding (ONLY company owner)
router.put(
  "/",
  protect,
  authorizeRoles("company"),
  updateCompanyBranding
);

export default router;
