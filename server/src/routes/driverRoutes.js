import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   📸 MULTER CONFIG — Save profile images locally (uploads/drivers)
   ========================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join("uploads", "drivers");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only .jpg, .jpeg, and .png formats are allowed"));
    }
    cb(null, true);
  },
});

/* ==========================================================
   🚚 CREATE DRIVER (with optional face image)
   ========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager"),
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password)
        return res.status(400).json({ error: "Missing required fields" });

      const existing = await User.findOne({ email });
      if (existing)
        return res.status(409).json({ error: "Email already registered" });

      const passwordHash = await bcrypt.hash(password, 10);

      // determine company association
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const profileImage = req.file
        ? `/uploads/drivers/${req.file.filename}`
        : null;

      const driver = await User.create({
        name,
        email,
        passwordHash,
        role: "driver",
        companyId,
        profileImage,
      });

      res.status(201).json({
        ok: true,
        message: "Driver created successfully",
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          companyId: driver.companyId,
          profileImage: driver.profileImage,
        },
      });
    } catch (err) {
      console.error("❌ Error creating driver:", err.message);
      res.status(500).json({ error: "Server error creating driver" });
    }
  }
);
/* ==========================================================
   📋 GET ALL DRIVERS — For company or manager
   ========================================================== */
router.get(
  "/get-all",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const drivers = await User.find({
        companyId,
        role: "driver",
      }).select("name email profileImage isActive createdAt");

      res.json({
        ok: true,
        count: drivers.length,
        drivers,
      });
    } catch (err) {
      console.error("❌ Error fetching drivers:", err.message);
      res.status(500).json({ error: "Server error fetching drivers" });
    }
  }
);

export default router;
