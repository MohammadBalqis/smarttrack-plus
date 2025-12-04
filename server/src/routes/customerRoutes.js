// server/src/routes/customerRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import GlobalSettings from "../models/GlobalSettings.js";
import Session from "../models/Session.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const router = Router();

/* ==========================================================
   🛡 MAINTENANCE MODE CHECK
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
   📸 MULTER STORAGE FOR PROFILE IMAGE
   (Customer uploads stay in uploads/customers)
========================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "customers");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only jpg, jpeg, png files allowed"));
    }
    cb(null, true);
  },
});

/* ==========================================================
   🟢 Get MY profile (customer only)
========================================================== */
router.get(
  "/profile",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const user = await User.findById(req.user._id).select("-passwordHash");
      res.json({ ok: true, user });
    } catch (err) {
      console.error("❌ Get customer profile error:", err.message);
      res.status(500).json({ error: "Error loading profile" });
    }
  }
);

/* ==========================================================
   🟡 Update MY profile (customer only)
========================================================== */
router.put(
  "/update-profile",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { name, phone, address } = req.body;

      const update = {};
      if (name) update.name = name;
      if (phone) update.phone = phone;
      if (address) update.address = address;

      const user = await User.findByIdAndUpdate(req.user._id, update, {
        new: true,
      }).select("-passwordHash");

      res.json({
        ok: true,
        message: "Profile updated",
        user,
      });
    } catch (err) {
      console.error("❌ Update customer profile error:", err.message);
      res.status(500).json({ error: "Error updating profile" });
    }
  }
);

/* ==========================================================
   🟣 Update MY profile image
========================================================== */
router.put(
  "/update-image",
  protect,
  authorizeRoles("customer"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const imagePath = `/uploads/customers/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profileImage: imagePath },
        { new: true }
      ).select("-passwordHash");

      res.json({
        ok: true,
        message: "Profile image updated",
        user,
      });
    } catch (err) {
      console.error("❌ Update customer image error:", err.message);
      res.status(500).json({ error: "Error updating image" });
    }
  }
);

/* ==========================================================
   🔴 DELETE MY ACCOUNT (soft delete)
========================================================== */
router.delete(
  "/delete-account",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { password, reason } = req.body || {};

      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      // we need passwordHash for comparison
      const user = await User.findById(req.user._id).select("+passwordHash");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      // Soft delete: deactivate + mark deleted. These fields are safe even if not defined in schema.
      user.isActive = false;
      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletedReason = reason || null;

      // Optional: anonymize email to avoid conflicts
      const suffix = Date.now();
      user.email = `deleted_${user._id}_${suffix}@deleted.local`;

      await user.save();

      // Revoke all active sessions
      await Session.updateMany(
        { userId: user._id, isActive: true },
        { isActive: false, isRevoked: true }
      );

      res.json({
        ok: true,
        message: "Account deleted and all sessions logged out.",
      });
    } catch (err) {
      console.error("❌ Delete account error:", err.message);
      res.status(500).json({ error: "Error deleting account" });
    }
  }
);

export default router;
