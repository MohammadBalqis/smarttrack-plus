import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { logActivity } from "../utils/activityLogger.js";   // ✅ FIXED IMPORT

export const createDriver = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const imgRelPath = req.file
      ? `/uploads/drivers/${req.file.filename}`
      : null;

    // companyId depends on logged-in company admin or manager
    const companyId =
      req.user.companyId ||
      (req.user.role === "company" ? req.user._id : null);

    const driver = await User.create({
      name,
      email,
      passwordHash,
      role: "driver",
      companyId: companyId || null,
      profileImage: imgRelPath,
      isActive: true,
    });

    // ⭐ ACTIVITY LOGGER
    await logActivity(req, {
      action: "DRIVER_CREATED",
      description: `Driver "${name}" was created`,
      category: "user",
      targetModel: "User",
      targetId: driver._id,
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
  } catch (e) {
    console.error("createDriver error:", e);

    // optional error logging
    await logActivity(req, {
      action: "DRIVER_CREATE_FAILED",
      description: e.message,
      category: "system",
    });

    res.status(500).json({ error: "Server error" });
  }
};
