// server/src/routes/authRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  register,
  login,
  superAdminCreateCompany,
  companyCreateUser,
} from "../controllers/authController.js";

// ✅ FIXED IMPORT — no other changes
import { logActivity } from "../utils/activityLogger.js";

const router = Router();

/* ==========================================================
   🔐 PUBLIC AUTH
========================================================== */
router.post("/register", async (req, res, next) => {
  try {
    await register(req, res);

    // 👉 Register success log (ONLY if no error)
    if (res.statusCode === 200 || res.statusCode === 201) {
      await logActivity({
        userId: null,
        action: "REGISTER_SUCCESS",
        description: `New account registered: ${req.body.email}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });
    }
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    await login(req, res);

    // 👉 Login success
    if (res.statusCode === 200) {
      await logActivity({
        userId: res.locals.userId,
        action: "LOGIN_SUCCESS",
        description: `User logged in: ${req.body.email}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });
    }
  } catch (err) {
    // 👉 Login failed
    await logActivity({
      userId: null,
      action: "LOGIN_FAILED",
      description: `Failed login attempt for: ${req.body.email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    next(err);
  }
});

/* ==========================================================
   🟣 SUPERADMIN → CREATE COMPANY
========================================================== */
router.post(
  "/superadmin/create-company",
  protect,
  authorizeRoles("superadmin"),
  async (req, res, next) => {
    try {
      await superAdminCreateCompany(req, res);

      if (res.statusCode === 200 || res.statusCode === 201) {
        await logActivity({
          userId: req.user._id,
          action: "SUPERADMIN_CREATE_COMPANY",
          description: `SuperAdmin created company: ${req.body.email}`,
          ipAddress: req.ip,
          deviceInfo: req.headers["user-agent"],
        });
      }
    } catch (err) {
      next(err);
    }
  }
);

/* ==========================================================
   🟠 COMPANY → CREATE MANAGER or DRIVER
========================================================== */
router.post(
  "/company/create-user",
  protect,
  authorizeRoles("company"),
  async (req, res, next) => {
    try {
      await companyCreateUser(req, res);

      if (res.statusCode === 200 || res.statusCode === 201) {
        await logActivity({
          userId: req.user._id,
          action: "COMPANY_CREATE_USER",
          description: `Company created a ${req.body.role}: ${req.body.email}`,
          ipAddress: req.ip,
          deviceInfo: req.headers["user-agent"],
        });
      }
    } catch (err) {
      next(err);
    }
  }
);

export default router;
