// server/src/controllers/driverController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import GlobalSettings from "../models/GlobalSettings.js";
import { logActivity } from "../utils/activityLogger.js";

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
   🟢 1. CREATE DRIVER (Company / Manager / Superadmin)
========================================================== */
export const createDriver = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const { name, email, password, companyId: bodyCompanyId } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({
        ok: false,
        error: "name, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({
        ok: false,
        error: "Email already in use",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const profileImage = req.file
      ? `/uploads/drivers/${req.file.filename}`
      : null;

    // Determine companyId
    let finalCompanyId = null;

    if (req.user.role === "company") {
      finalCompanyId = req.user._id;
    } else if (req.user.role === "manager") {
      finalCompanyId = req.user.companyId;
    } else if (req.user.role === "superadmin") {
      if (!bodyCompanyId) {
        return res.status(400).json({
          ok: false,
          error: "companyId is required when creating drivers as superadmin.",
        });
      }
      finalCompanyId = bodyCompanyId;
    } else {
      return res.status(403).json({
        ok: false,
        error: "You are not allowed to create drivers.",
      });
    }

    const driver = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "driver",
      companyId: finalCompanyId,
      profileImage,
      driverStatus: "offline",
      isActive: true,
    });

    await logActivity({
      userId: req.user._id,
      action: "DRIVER_CREATED",
      description: `Driver "${driver.name}" created`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        driverId: driver._id,
        companyId: finalCompanyId,
      },
    });

    res.status(201).json({
      ok: true,
      message: "Driver created successfully",
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        role: driver.role,
        companyId: driver.companyId,
        profileImage: driver.profileImage,
      },
    });
  } catch (err) {
    console.error("❌ createDriver error:", err);

    await logActivity({
      userId: req.user?._id,
      action: "DRIVER_CREATE_FAILED",
      description: err.message,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    res.status(500).json({
      ok: false,
      error: "Server error creating driver",
    });
  }
};

/* ==========================================================
   📋 2. GET ALL DRIVERS
========================================================== */
export const getAllDrivers = async (req, res) => {
  try {
    const filter = { role: "driver" };

    if (req.user.role === "company") {
      filter.companyId = req.user._id;
    } else if (req.user.role === "manager") {
      filter.companyId = req.user.companyId;
      filter.managerId = req.user._id;
    } else if (req.user.role === "superadmin") {
      if (req.query.companyId) {
        filter.companyId = req.query.companyId;
      }
    }

    const drivers = await User.find(filter).select(
      "name email companyId managerId profileImage isActive driverStatus createdAt"
    );

    res.json({
      ok: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    console.error("❌ getAllDrivers error:", err.message);
    res.status(500).json({ error: "Server error fetching drivers" });
  }
};
