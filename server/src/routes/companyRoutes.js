// server/src/routes/companyRoutes.js
import { Router } from "express";
import Company from "../models/Company.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import Payment from "../models/Payment.js";
import GlobalSettings from "../models/GlobalSettings.js";
import bcrypt from "bcryptjs";
import { logActivity } from "../utils/activityLogger.js";

import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

/* ==========================================================
   🛡 MAINTENANCE MODE CHECK (GLOBAL)
========================================================== */
const ensureNotInMaintenance = async (req, res) => {
  const settings = await GlobalSettings.findOne();
  if (settings?.maintenanceMode && req.user.role !== "superadmin") {
    res.status(503).json({
      ok: false,
      error: "System is under maintenance.",
    });
    return false;
  }
  return true;
};

/* ==========================================================
   🔑 HELPERS
========================================================== */
const resolveCompanyIdFromUser = (user) =>
  user.role === "company" ? user._id : user.companyId;

/* ==========================================================
   🟣 SUPERADMIN — COMPANY MANAGEMENT
========================================================== */

router.get(
  "/superadmin/list",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const companies = await Company.find()
        .populate("ownerId", "name email role")
        .sort({ createdAt: -1 });

      await logActivity({
        userId: req.user._id,
        action: "SUPERADMIN_LIST_COMPANIES",
        description: "Superadmin viewed all companies",
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });

      res.json({ ok: true, total: companies.length, companies });
    } catch (err) {
      console.error("❌ Superadmin list companies error:", err.message);
      res.status(500).json({ error: "Server error loading companies" });
    }
  }
);

router.post(
  "/superadmin/create",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const {
        name,
        email,
        phone,
        address,
        ownerId,
        logo,
        taxNumber,
        crNumber,
        businessType,
      } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          error: "Company name and email required",
        });
      }

      const existing = await Company.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: "Company already exists" });
      }

      const company = await Company.create({
        name,
        email,
        phone,
        address,
        ownerId: ownerId || null,
        logo: logo || null,
        taxNumber: taxNumber || "",
        crNumber: crNumber || "",
        businessType: businessType || "",
      });

      await logActivity({
        userId: req.user._id,
        action: "SUPERADMIN_CREATE_COMPANY",
        description: `Created company: ${name}`,
        targetUserId: ownerId || null,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });

      res.status(201).json({
        ok: true,
        message: "Company created by superadmin",
        company,
      });
    } catch (err) {
      console.error("❌ Superadmin create company error:", err.message);
      res.status(500).json({ error: "Server error creating company" });
    }
  }
);

/* ==========================================================
   🟦 COMPANY / MANAGER DASHBOARD
   (Products & analytics live in separate routes)
========================================================== */
router.get(
  "/dashboard",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const companyId = resolveCompanyIdFromUser(req.user);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        totalDrivers,
        availableDrivers,
        totalVehicles,
        availableVehicles,
        todayTrips,
        monthTrips,
      ] = await Promise.all([
        User.countDocuments({ companyId, role: "driver" }),
        User.countDocuments({ companyId, role: "driver", isActive: true }),
        Vehicle.countDocuments({ companyId }),
        Vehicle.countDocuments({ companyId, status: "available" }),
        Trip.countDocuments({ companyId, createdAt: { $gte: today } }),
        Trip.countDocuments({ companyId, createdAt: { $gte: monthStart } }),
      ]);

      await logActivity({
        userId: req.user._id,
        action: "VIEW_COMPANY_DASHBOARD",
        description: "Company/Manager viewed dashboard",
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });

      res.json({
        ok: true,
        summary: {
          drivers: { total: totalDrivers, available: availableDrivers },
          vehicles: { total: totalVehicles, available: availableVehicles },
          trips: { today: todayTrips, month: monthTrips },
        },
      });
    } catch (err) {
      console.error("❌ Dashboard error:", err.message);
      res.status(500).json({ error: "Server error loading dashboard" });
    }
  }
);

/* ==========================================================
   🔵 CUSTOMER MANAGEMENT
   (Scoped per company)
========================================================== */

/* ---------- MULTER STORAGE ---------- */
const customerDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "customers", "documents");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const uploadCustomerDoc = multer({ storage: customerDocStorage });

/* ---------------- CUSTOMER ROUTES ---------------- */

router.get(
  "/customers/list",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const companyId = resolveCompanyIdFromUser(req.user);

      const customers = await User.find({
        role: "customer",
        $or: [{ companyIds: companyId }, { companyId }],
      })
        .select("-passwordHash")
        .sort({ createdAt: -1 });

      res.json({ ok: true, customers });
    } catch (err) {
      console.error("❌ Load customers error:", err.message);
      res.status(500).json({ error: "Error loading customers" });
    }
  }
);

/* ==========================================================
   ⚠️ IMPORTANT NOTE
========================================================== */
/*
  ❗ Product routes are NOT defined here.

  ✔ Products → /api/company/products
     (companyProductRoutes.js)

  ✔ Analytics → /api/company/products/analytics
     (productAnalyticsRoutes.js)

  This separation is intentional and correct.
*/

export default router;
