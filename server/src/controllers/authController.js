// server/src/controllers/authController.js
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Session from "../models/Session.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logActivity } from "../utils/activityLogger.js";
import { getClientInfo } from "../utils/clientInfo.js";

/* ==========================================================
   🔐 JWT + SESSION HELPERS
========================================================== */

const MAX_ACTIVE_SESSIONS = 3;

const generateTokenWithSession = (user, sessionId) =>
  jwt.sign(
    {
      uid: user._id,
      role: user.role,
      companyId: user.companyId || null,
      shopId: user.shopId || null,
      isSuperAdmin: user.role === "superadmin",
      sid: sessionId, // session id
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

const createAuthTokenWithSession = async (req, user) => {
  const client = getClientInfo(req);

  // (1) ENFORCE MAX ACTIVE SESSIONS
  const activeSessions = await Session.find({
    userId: user._id,
    isActive: true,
    isRevoked: false,
  })
    .sort({ createdAt: 1 }) // oldest first
    .lean();

  if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
    const toRevoke = activeSessions.slice(
      0,
      activeSessions.length - (MAX_ACTIVE_SESSIONS - 1)
    );

    if (toRevoke.length > 0) {
      await Session.updateMany(
        { _id: { $in: toRevoke.map((s) => s._id) } },
        { isActive: false, isRevoked: true, revokedAt: new Date() }
      );
    }
  }

  // (2) CREATE NEW SESSION
  const session = await Session.create({
    userId: user._id,
    ipAddress: client.ipAddress,
    userAgent: client.userAgent,
    deviceType: client.deviceType,
    os: client.os,
    browser: client.browser,
    deviceId: client.deviceId,
    isActive: true,
    isRevoked: false,
  });

  // (3) CREATE JWT
  const token = generateTokenWithSession(user, session._id.toString());

  return { token, session };
};

/* ==========================================================
   🟢 REGISTER — Public (CUSTOMERS ONLY)
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
      isActive: true,
    });

    await logActivity({
      userId: user._id,
      action: "REGISTER",
      description: `Customer registered: ${user.email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    const { token, session } = await createAuthTokenWithSession(req, user);

    res.status(201).json({
      ok: true,
      message: "Customer registered",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "customer",
      },
      token,
      sessionId: session._id,
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
      await logActivity({
        action: "LOGIN_FAILED",
        description: `Email not found: ${email}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.isActive) {
      await logActivity({
        userId: user._id,
        action: "LOGIN_FAILED_SUSPENDED",
        description: `Suspended account tried to login: ${email}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });
      return res.status(403).json({ error: "Account suspended" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await logActivity({
        userId: user._id,
        action: "LOGIN_INVALID_PASSWORD",
        description: `Invalid password: ${email}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });
      return res.status(401).json({ error: "Invalid password" });
    }

    const { token, session } = await createAuthTokenWithSession(req, user);

    await logActivity({
      userId: user._id,
      action: "LOGIN_SUCCESS",
      description: `User logged in: ${email}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
      meta: {
        sessionId: session._id,
        deviceType: session.deviceType,
        os: session.os,
        browser: session.browser,
      },
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
        shopId: user.shopId,
        isSuperAdmin: user.role === "superadmin",
      },
      token,
      sessionId: session._id,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* ==========================================================
   👑 SUPERADMIN CREATES COMPANY
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
    const { name, email, password, role, shopId } = req.body;

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

    /* ==========================================================
       🟣 MANAGER MUST HAVE shopId
    ========================================================== */
    if (role === "manager") {
      if (!shopId)
        return res
          .status(400)
          .json({ error: "shopId is required when creating a manager" });

      const shop = await Shop.findOne({
        _id: shopId,
        companyId: req.user._id,
        isActive: true,
      });

      if (!shop) {
        return res.status(404).json({
          error: "Shop not found or does not belong to your company",
        });
      }
    }

    /* ==========================================================
       🟡 DRIVER shopId = optional
    ========================================================== */

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      companyId: req.user._id,
      shopId: shopId || null,
      isActive: true,
    });

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
