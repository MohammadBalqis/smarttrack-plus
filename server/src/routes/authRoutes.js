import { Router } from "express";
import sanitize from "sanitize-html";
import Joi from "joi";
import { UAParser } from "ua-parser-js";


import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiters.js";

import {
  register,
  login,
  superAdminCreateCompany,
  companyCreateUser,
} from "../controllers/authController.js";

import { logActivity } from "../utils/activityLogger.js";
import Session from "../models/Session.js";

const router = Router();

/* ==========================================================
   🧼 VALIDATION SCHEMAS
========================================================== */
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(40).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(80).required(),
  role: Joi.string().valid("customer", "driver", "manager", "company"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/* ==========================================================
   🔐 REGISTER
========================================================== */
router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

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
   🔐 LOGIN
========================================================== */
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // run login controller
    const loginResult = await login(req, res);
    if (!loginResult || !res.locals.userId) return; // login controller handles failures

    /* ==========================================================
       🎯 CREATE USER SESSION
    ========================================================== */
    const parser = new UAParser(req.headers["user-agent"]);
    const ua = parser.getResult();

    await Session.create({
      userId: res.locals.userId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      deviceType: parser.getDevice().type || "desktop",
      os: ua.os?.name,
      browser: ua.browser?.name,
      lastActivityAt: new Date(),
    });

    await logActivity({
      userId: res.locals.userId,
      action: "LOGIN_SUCCESS",
      description: `User logged in: ${req.body.email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });
  } catch (err) {
    await logActivity({
      action: "LOGIN_FAILED",
      description: `Failed login attempt: ${req.body.email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });
    next(err);
  }
});

/* ==========================================================
   👑 SUPERADMIN CREATE COMPANY
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

      if (res.statusCode === 200 || res.statusCode === 201) {
        await logActivity({
          userId: req.user._id,
          action: "SUPERADMIN_CREATE_COMPANY",
          description: `Company created: ${req.body.email}`,
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
   🟠 COMPANY OWNER CREATE USER
========================================================== */
router.post(
  "/company/create-user",
  protect,
  authorizeRoles("company"),
  async (req, res, next) => {
    try {
      const allowedRoles = ["manager", "driver"];
      if (!allowedRoles.includes(req.body.role)) {
        return res
          .status(400)
          .json({ error: "Company can only create managers or drivers" });
      }

      req.body.email = sanitize(req.body.email || "");
      req.body.name = sanitize(req.body.name || "");

      await companyCreateUser(req, res);

      if (res.statusCode === 200 || res.statusCode === 201) {
        await logActivity({
          userId: req.user._id,
          action: "COMPANY_CREATE_USER",
          description: `Created user: ${req.body.email}`,
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
