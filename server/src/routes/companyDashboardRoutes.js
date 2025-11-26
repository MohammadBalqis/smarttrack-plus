// server/src/routes/companyDashboardRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getCompanyDashboard } from "../controllers/companyDashboardController.js";

const router = Router();

/* ==========================================================
   📊 COMPANY DASHBOARD SUMMARY
   /api/company/dashboard
========================================================== */
router.get(
  "/dashboard",
  protect,
  authorizeRoles("company", "manager"), // manager can also see company dashboard if you want
  getCompanyDashboard
);

export default router;
