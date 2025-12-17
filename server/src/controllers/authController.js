import User from "../models/User.js";
import Session from "../models/Session.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getClientInfo } from "../utils/clientInfo.js";
import Company from "../models/Company.js";
import CompanyApplication from "../models/CompanyApplication.js";
import { logActivity } from "../utils/activityLogger.js";

/* ==========================================================
   🔐 SESSION + JWT HELPERS
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
      sid: sessionId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

const createAuthTokenWithSession = async (req, user) => {
  const client = getClientInfo(req);

  const active = await Session.find({
    userId: user._id,
    isActive: true,
    isRevoked: false,
  }).sort({ createdAt: 1 });

  if (active.length >= MAX_ACTIVE_SESSIONS) {
    await Session.updateOne(
      { _id: active[0]._id },
      { isActive: false, isRevoked: true, revokedAt: new Date() }
    );
  }

  const session = await Session.create({
    userId: user._id,
    ...client,
    isActive: true,
    isRevoked: false,
  });

  const token = generateTokenWithSession(user, session._id.toString());
  return { token, session };
};

/* ==========================================================
   🟢 REGISTER CUSTOMER  ✅ FIXED (PHONE)
========================================================== */
export const register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const exists = await User.findOne({ phone: phone.trim() });
    if (exists) return res.status(409).json({ error: "Phone already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      passwordHash,
      role: "customer",
      isActive: true,
      createdVia: "self",
    });

    const { token, session } = await createAuthTokenWithSession(req, user);

    return res.status(201).json({
      ok: true,
      message: "Customer registered",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: "customer",
      },
      token,
      sessionId: session._id,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ==========================================================
   🟡 LOGIN — ALL ROLES ✅ FIXED (EMAIL OR PHONE)
========================================================== */
export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        error: "Email or phone and password are required",
      });
    }

    const user = await User.findOne({
      $or: [
        email ? { email: email.toLowerCase().trim() } : null,
        phone ? { phone: phone.trim() } : null,
      ].filter(Boolean),
    }).select("+passwordHash");

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isActive)
      return res.status(403).json({ error: "Account suspended" });

    /* ===============================
       🏢 COMPANY APPROVAL GATE (keep your logic)
    ================================ */
    if (user.role === "company") {
      if (user.companyStatus === "pending") {
        return res.status(403).json({
          error:
            "Your company account is pending System Owner approval. Please wait.",
        });
      }

      if (user.companyStatus === "rejected") {
        return res.status(403).json({
          error:
            "Your company registration was rejected. Please contact support.",
        });
      }

      if (user.companyId) {
        const company = await Company.findById(user.companyId).select("isActive");
        if (company && company.isActive === false) {
          return res.status(403).json({
            error: "Company is disabled by System Owner.",
          });
        }
      }
    }

    /* ===============================
       ✅ ROLE LOGIN RULES (from your User model virtuals)
    ================================ */
    if (user.role === "customer" && user.canCustomerLogin === false) {
      return res.status(403).json({ error: "Customer account not ready" });
    }

    if (user.role === "driver" && user.canDriverLogin === false) {
      return res.status(403).json({ error: "Driver account not ready" });
    }

    if (user.role === "manager" && user.canManagerLogin === false) {
      return res.status(403).json({ error: "Manager account not ready" });
    }

    /* ===============================
       🔐 PASSWORD CHECK (SINGLE SOURCE)
    ================================ */
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    const { token, session } = await createAuthTokenWithSession(req, user);

    return res.json({
      ok: true,
      message: "Logged in",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyId: user.companyId || null,
        shopId: user.shopId || null,
        isSuperAdmin: user.role === "superadmin",
        isSystemOwner: user.isSystemOwner || false,
      },
      token,
      sessionId: session._id,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ==========================================================
   👑 SUPERADMIN CREATES COMPANY (manual)  ✅ KEPT
========================================================== */
export const superAdminCreateCompany = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const companyUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "company",
      companyName: (companyName || name).trim(),
      companyStatus: "approved",
      isActive: true,
    });

    return res.status(201).json({
      ok: true,
      message: "Company created successfully",
      company: companyUser,
    });
  } catch (err) {
    console.error("SuperAdmin Create Company error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ==========================================================
   🟠 COMPANY CREATES MANAGER / DRIVER ✅ KEPT
========================================================== */
export const companyCreateUser = async (req, res) => {
  try {
    const { name, email, password, role, shopId } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "Missing fields" });

    if (!["manager", "driver"].includes(role))
      return res.status(400).json({ error: "Invalid role" });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      companyId: req.user.companyId || req.user._id,
      shopId: role === "manager" ? shopId : null,
      isActive: true,
    });

    return res.status(201).json({
      ok: true,
      message: `${role} created successfully`,
      user,
    });
  } catch (err) {
    console.error("Company create user error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ==========================================================
   👑 CREATE SYSTEM OWNER (dev) ✅ KEPT
========================================================== */
export const createSystemOwner = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const owner = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "superadmin",
      isSystemOwner: true,
      isActive: true,
    });

    return res.status(201).json({
      ok: true,
      message: "System Owner created successfully",
      owner,
    });
  } catch (err) {
    console.error("Create System Owner error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ==========================================================
   🏢 PUBLIC — COMPANY REGISTRATION REQUEST (PENDING) ✅ KEPT
========================================================== */
export const registerCompanyRequest = async (req, res) => {
  try {
    const {
      companyName,
      ownerName,
      email,
      password,
      phone,
      address,
      businessCategory,
      commercialRegistrationNumber,
      documentFileName,
      documentFileUrl,
    } = req.body;

    if (
      !companyName ||
      !ownerName ||
      !email ||
      !password ||
      !commercialRegistrationNumber ||
      !documentFileUrl
    ) {
      return res.status(400).json({
        error:
          "Missing fields. companyName, ownerName, email, password, commercialRegistrationNumber, and documentFileUrl are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCompany = companyName.trim();

    const existsUser = await User.findOne({ email: normalizedEmail });
    if (existsUser) return res.status(409).json({ error: "Email already used" });

    const existsApp = await CompanyApplication.findOne({
      companyEmail: normalizedEmail,
      status: "pending",
    });
    if (existsApp)
      return res.status(409).json({
        error: "You already submitted an application. Please wait for approval.",
      });

    const existsCompany = await Company.findOne({ name: normalizedCompany });
    if (existsCompany)
      return res.status(409).json({ error: "Company name already used" });

    const existsCompanyAppName = await CompanyApplication.findOne({
      companyName: normalizedCompany,
      status: "pending",
    });
    if (existsCompanyAppName)
      return res.status(409).json({
        error: "A pending application already uses this company name.",
      });

    const passwordHash = await bcrypt.hash(password, 10);

    const app = await CompanyApplication.create({
      companyName: normalizedCompany,
      companyEmail: normalizedEmail,
      ownerName: ownerName.trim(),
      phone: phone || "",
      address: address || "",
      businessCategory: businessCategory || "other",
      commercialRegistrationNumber: commercialRegistrationNumber.trim(),
      documentFileName: documentFileName || "company-document",
      documentUrl: documentFileUrl,
      passwordHash,
      status: "pending",
    });

    await logActivity({
      userId: null,
      action: "COMPANY_REGISTER_REQUEST",
      description: `Company registration requested: ${app.companyName} (${app.companyEmail})`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    return res.status(201).json({
      ok: true,
      message:
        "Registration received. Your company account is pending System Owner approval.",
      applicationId: app._id,
      status: app.status,
    });
  } catch (err) {
    console.error("registerCompanyRequest error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
/* ==========================================================
   HELPERS
========================================================== */
const sanitize = (v) => (typeof v === "string" ? v.trim() : v);

const ensureScope = async (req, driverId) =>
  Driver.findOne({
    _id: driverId,
    managerId: req.user._id,
    companyId: req.user.companyId,
  });

/* ==========================================================
   GET DRIVERS
========================================================== */
export const getManagerDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({
      managerId: req.user._id,
      companyId: req.user.companyId,
    }).sort({ createdAt: -1 });

    res.json({ ok: true, drivers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load drivers" });
  }
};

/* ==========================================================
   CREATE DRIVER PROFILE
========================================================== */
export const createDriverProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name)
      return res.status(400).json({ error: "Driver name required" });

    const driver = await Driver.create({
      name: sanitize(name),
      phone: sanitize(phone) || "",
      address: sanitize(address) || "",
      managerId: req.user._id,
      companyId: req.user.companyId,
      status: "offline",
      verification: { status: "pending" },
      hasAccount: false,
      isSuspended: false,
    });

    res.status(201).json({ ok: true, driver });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Create driver failed" });
  }
};

/* ==========================================================
   SUBMIT VERIFICATION
========================================================== */
export const submitDriverVerification = async (req, res) => {
  try {
    const driver = await ensureScope(req, req.params.driverId);
    if (!driver)
      return res.status(404).json({ error: "Driver not found" });

    const { idNumber, plateNumber, vehicleType, brand, model } = req.body;

    if (!idNumber || !plateNumber || !vehicleType || !brand || !model)
      return res.status(400).json({ error: "Missing fields" });

    if (!req.files?.idImage?.[0] || !req.files?.vehicleImage?.[0])
      return res.status(400).json({ error: "Images required" });

    const idImage = `/uploads/drivers/id/${req.files.idImage[0].filename}`;
    const vehicleImage = `/uploads/drivers/vehicle/${req.files.vehicleImage[0].filename}`;

    driver.verification = {
      idNumber: sanitize(idNumber),
      idImage,
      status: "verified",
      verifiedAt: new Date(),
    };

    driver.vehicle = {
      plateNumber: sanitize(plateNumber),
      image: vehicleImage,
      type: sanitize(vehicleType),
    };

    await driver.save();

    await Vehicle.create({
      companyId: driver.companyId,
      driverId: driver._id,
      type: sanitize(vehicleType),
      brand: sanitize(brand),
      model: sanitize(model),
      plateNumber: sanitize(plateNumber),
      vehicleImage,
      driverCertificate: idImage,
      status: "active",
    });

    res.json({ ok: true, message: "Driver verified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
};

/* ==========================================================
   CREATE DRIVER ACCOUNT (FINAL FIX)
========================================================== */
export const createDriverAccount = async (req, res) => {
  try {
    const { email, password } = req.body;
    const driver = await ensureScope(req, req.params.driverId);

    if (!driver)
      return res.status(404).json({ error: "Driver not found" });

    if (driver.verification?.status !== "verified")
      return res.status(400).json({ error: "Driver not verified" });

    if (driver.hasAccount)
      return res.status(400).json({ error: "Account already exists" });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(409).json({ error: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: "driver",
      companyId: driver.companyId,
      isActive: true,
    });

    driver.userId = user._id;
    driver.hasAccount = true;
    await driver.save();

    res.json({ ok: true, message: "Driver account created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Create account failed" });
  }
};