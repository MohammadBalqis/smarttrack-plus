import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getSuperadminStats } from "../controllers/adminStatsController.js";

const router = Router();

router.get(
  "/stats",
  protect,
  authorizeRoles("superadmin"),
  getSuperadminStats
);

export default router;
