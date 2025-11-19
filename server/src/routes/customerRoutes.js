// server/src/routes/customerRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

/* ==========================================================
   📸 MULTER STORAGE FOR PROFILE IMAGE
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
      return cb(new Error("Only jpg, png files allowed"));
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

export default router;
