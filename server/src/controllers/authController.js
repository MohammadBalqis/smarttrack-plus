// server/src/controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logActivity } from "../utils/activityLogger.js";


/* ==========================================================
   🔐 GENERATE JWT TOKEN
========================================================== */
const generateToken = (user) =>
  jwt.sign(
    {
      uid: user._id,
      role: user.role,
      companyId: user.companyId || null,
      managerId: user.managerId || null,
      isSuperAdmin: user.role === "superadmin",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

/* ==========================================================
   🟢 REGISTER — Public (Customer only)
========================================================== */
export const register = async (req, res) => {
  try {
    const { name, email, password, role = "customer" } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    if (role !== "customer")
      return res.status(403).json({
        error: "Only customers can self-register",
      });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "customer",
    });

    // ✅ Activity Log
    await logActivity({
      userId: user._id,
      action: "REGISTER",
      description: `Customer registered: ${user.email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    res.status(201).json({
      ok: true,
      message: "Customer registered",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "customer",
      },
      token: generateToken(user),
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* ==========================================================
   🟡 LOGIN — All roles
========================================================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // ❌ Log failed login
      await logActivity({
        userId: null,
        action: "LOGIN_FAILED",
        description: `Login failed — email not found: ${email}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.isActive) {
      await logActivity({
        userId: user._id,
        action: "LOGIN_FAILED_SUSPENDED",
        description: `Suspended account tried to log in: ${email}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });
      return res.status(403).json({ error: "Account suspended" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // ❌ Wrong password
      await logActivity({
        userId: user._id,
        action: "LOGIN_INVALID_PASSWORD",
        description: `Invalid password for: ${email}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });
      return res.status(401).json({ error: "Invalid password" });
    }

    // Store userId for logging in route wrapper
    res.locals.userId = user._id;

    // ✅ LOGIN SUCCESS
    await logActivity({
      userId: user._id,
      action: "LOGIN_SUCCESS",
      description: `User logged in: ${email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    res.json({
      ok: true,
      message: "Logged in",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        managerId: user.managerId,
        isSuperAdmin: user.role === "superadmin",
      },
      token: generateToken(user),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* ==========================================================
   🟣 SUPERADMIN CREATES COMPANY
========================================================== */
export const superAdminCreateCompany = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const company = await User.create({
      name,
      email,
      passwordHash,
      role: "company",
      companyName: companyName || name,
      isActive: true,
    });

    // ✅ LOG ACTION
    await logActivity({
      userId: req.user._id,
      action: "SUPERADMIN_CREATE_COMPANY",
      description: `SuperAdmin created company: ${email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    res.status(201).json({
      ok: true,
      message: "Company created successfully",
      company,
    });
  } catch (err) {
    console.error("Superadmin create company error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* ==========================================================
   🟠 COMPANY CREATES MANAGER or DRIVER
========================================================== */
export const companyCreateUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "Missing fields" });

    if (!["manager", "driver"].includes(role))
      return res
        .status(400)
        .json({ error: "Role must be 'manager' or 'driver'" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ error: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      companyId: req.user._id,
      managerId: role === "driver" ? managerId || null : null,
    });

    // ✅ Activity Log
    await logActivity({
      userId: req.user._id,
      action: "COMPANY_CREATE_USER",
      description: `Company created ${role}: ${email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    res.status(201).json({
      ok: true,
      message: `${role} created successfully`,
      user: newUser,
    });
  } catch (err) {
    console.error("Company create user error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
