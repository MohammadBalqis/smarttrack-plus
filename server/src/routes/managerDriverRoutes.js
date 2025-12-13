import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerDrivers,

  // profile (NO login yet)
  createManagerDriverProfile,
  updateManagerDriverProfile,

  // verification
  upsertManagerDriverVerification,
  verifyManagerDriver,
  rejectManagerDriver,

  // account creation (AFTER verification)
  createManagerDriverAccount,

  // status & stats
  toggleManagerDriverStatus,
  getManagerDriverStats,
} from "../controllers/managerDriversController.js";

const router = Router();

/* ==========================================================
   🔐 PROTECTION
========================================================== */
router.use(protect, authorizeRoles("manager", "company"));

/* ==========================================================
   🚗 DRIVERS LIST (cards / table)
   GET /api/manager/drivers
========================================================== */
router.get("/drivers", getManagerDrivers);

/* ==========================================================
   ➕ CREATE DRIVER PROFILE (NO EMAIL / PASSWORD)
   POST /api/manager/drivers
========================================================== */
router.post("/drivers", createManagerDriverProfile);

/* ==========================================================
   ✏ UPDATE DRIVER PROFILE
   PATCH /api/manager/drivers/:driverId/profile
========================================================== */
router.patch(
  "/drivers/:driverId/profile",
  updateManagerDriverProfile
);

/* ==========================================================
   🛂 SUBMIT / UPDATE VERIFICATION INFO
   PATCH /api/manager/drivers/:driverId/verification
========================================================== */
router.patch(
  "/drivers/:driverId/verification",
  upsertManagerDriverVerification
);

/* ==========================================================
   ✅ VERIFY DRIVER (MANAGER ACTION)
   PATCH /api/manager/drivers/:driverId/verify
========================================================== */
router.patch(
  "/drivers/:driverId/verify",
  verifyManagerDriver
);

/* ==========================================================
   ❌ REJECT DRIVER
   PATCH /api/manager/drivers/:driverId/reject
========================================================== */
router.patch(
  "/drivers/:driverId/reject",
  rejectManagerDriver
);

/* ==========================================================
   🔐 CREATE LOGIN ACCOUNT (ONLY AFTER VERIFIED)
   POST /api/manager/drivers/:driverId/create-account
========================================================== */
router.post(
  "/drivers/:driverId/create-account",
  createManagerDriverAccount
);

/* ==========================================================
   🔁 ACTIVATE / SUSPEND DRIVER
   PATCH /api/manager/drivers/:driverId/toggle
========================================================== */
router.patch(
  "/drivers/:driverId/toggle",
  toggleManagerDriverStatus
);

/* ==========================================================
   📊 DRIVER PERFORMANCE STATS
   GET /api/manager/drivers/:driverId/stats
========================================================== */
router.get(
  "/drivers/:driverId/stats",
  getManagerDriverStats
);

export default router;
