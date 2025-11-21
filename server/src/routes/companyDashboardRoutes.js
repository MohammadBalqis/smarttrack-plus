import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getCompanyDashboardStats } from "../controllers/companyDashboardController.js";

const router = Router();

/* ==========================================================
   📊 COMPANY DASHBOARD STATS (Company / Manager)
   ========================================================== */
router.get(
  "/stats",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyDashboardStats
);

export default router;
