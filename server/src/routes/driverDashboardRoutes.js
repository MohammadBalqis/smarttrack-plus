import express from "express";
import { protect, requireDriver } from "../middleware/authMiddleware.js";
import { getDriverDashboardStats } from "../controllers/driverDashboardController.js";

const router = express.Router();

/* ==========================================================
   DRIVER DASHBOARD
   GET /api/driver/dashboard
========================================================== */
router.get("/", protect, requireDriver, getDriverDashboardStats);

export default router;
