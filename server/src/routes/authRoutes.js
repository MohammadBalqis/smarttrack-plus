import { Router } from "express";
import sanitize from "sanitize-html";
import Joi from "joi";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiters.js";

import {
  register,
  login,
  superAdminCreateCompany,
  companyCreateUser,
  createSystemOwner,
} from "../controllers/authController.js";

import { registerCompany } from "../controllers/auth/companyRegisterController.js";
import { registerCustomer } from "../controllers/auth/customerRegisterController.js";

import uploadCompanyDoc, {
  uploadCustomerImage,
} from "../middleware/uploadMiddleware.js";

import { logActivity } from "../utils/activityLogger.js";

const router = Router();

/* ==========================================================
   🧼 VALIDATION SCHEMAS
========================================================== */
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(40).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(80).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().min(5).optional(),
  password: Joi.string().required(),
}).or("email", "phone");

/* ==========================================================
   🟢 REGISTER (EMAIL BASED — EXISTING)
========================================================== */
router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    req.body.email = sanitize(req.body.email);
    req.body.name = sanitize(req.body.name);

    await register(req, res);
  } catch (err) {
    next(err);
  }
});

/* ==========================================================
   🟡 LOGIN (EMAIL BASED)
========================================================== */
router.post("/login", loginLimiter, async (req, res) => {
  try {
    if (req.body.email) {
      req.body.email = sanitize(req.body.email);
    }

    if (req.body.phone) {
      req.body.phone = sanitize(req.body.phone);
    }

    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    await login(req, res);

    await logActivity({
      action: "LOGIN_SUCCESS",
      description: `Login: ${req.body.email || req.body.phone}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });
  } catch (err) {
    await logActivity({
      action: "LOGIN_FAILED",
      description: `Failed login: ${req.body.email || req.body.phone}`,
      ipAddress: req.ip,
    });

    res.status(500).json({ error: "Server error" });
  }
});


/* ==========================================================
   👤 CUSTOMER REGISTER (PHONE BASED — NEW)
========================================================== */
router.post(
  "/register-customer",
  registerLimiter,
  uploadCustomerImage,
  registerCustomer
);

/* ==========================================================
   👑 SUPERADMIN CREATES COMPANY
========================================================== */
router.post(
  "/superadmin/create-company",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    req.body.email = sanitize(req.body.email || "");
    req.body.name = sanitize(req.body.name || "");

    await superAdminCreateCompany(req, res);
  }
);

/* ==========================================================
   🟠 COMPANY CREATES MANAGER / DRIVER
========================================================== */
router.post(
  "/company/create-user",
  protect,
  authorizeRoles("company"),
  async (req, res) => {
    req.body.email = sanitize(req.body.email || "");
    req.body.name = sanitize(req.body.name || "");

    await companyCreateUser(req, res);
  }
);

/* ==========================================================
   🔧 DEV / SYSTEM ROUTES
========================================================== */
router.post("/register-owner", createSystemOwner);
router.post("/register-company", registerCompany);

export default router;
