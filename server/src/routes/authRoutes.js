// server/src/routes/authRoutes.js

import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

// ✅ Use ONLY ONE RATE LIMITER FILE
import { loginLimiter, registerLimiter } from "../middleware/rateLimiters.js";

import {
  register,
  login,
  superAdminCreateCompany,
  companyCreateUser,
} from "../controllers/authController.js";

import { logActivity } from "../utils/activityLogger.js";
import sanitize from "sanitize-html";
import Joi from "joi";

const router = Router();

/* ==========================================================
   🧼 INPUT VALIDATION SCHEMAS
========================================================== */
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(40).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(80).required(),
  role: Joi.string().valid("customer", "driver", "manager", "company").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/* ==========================================================
   🔐 REGISTER — Public + Rate Limited
========================================================== */
router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    req.body.email = sanitize(req.body.email);
    req.body.name = sanitize(req.body.name);

    await register(req, res);

    if (res.statusCode === 200 || res.statusCode === 201) {
      await logActivity({
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

/* ==========================================================
   🔐 LOGIN — All Roles + Rate Limited
========================================================== */
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await login(req, res);

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
    await logActivity({
      action: "LOGIN_FAILED",
      description: `Failed login: ${req.body.email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });
    next(err);
  }
});

/* ==========================================================
   👑 SUPERADMIN → CREATE COMPANY
========================================================== */
router.post(
  "/superadmin/create-company",
  protect,
  authorizeRoles("superadmin"),
  async (req, res, next) => {
    try {
      req.body.email = sanitize(req.body.email || "");
      req.body.name = sanitize(req.body.name || "");

      await superAdminCreateCompany(req, res);

      if (res.statusCode === 201 || res.statusCode === 200) {
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
   🟠 COMPANY OWNER → CREATE USER
========================================================== */
router.post(
  "/company/create-user",
  protect,
  authorizeRoles("company"),
  async (req, res, next) => {
    try {
      const allowedRoles = ["manager", "driver"];
      if (!allowedRoles.includes(req.body.role)) {
        return res.status(400).json({
          error: "Company owners can only create managers or drivers.",
        });
      }

      req.body.email = sanitize(req.body.email || "");
      req.body.name = sanitize(req.body.name || "");

      await companyCreateUser(req, res);

      if (res.statusCode === 201 || res.statusCode === 200) {
        await logActivity({
          userId: req.user._id,
          action: "COMPANY_CREATE_USER",
          description: `Company created ${req.body.role}: ${req.body.email}`,
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
