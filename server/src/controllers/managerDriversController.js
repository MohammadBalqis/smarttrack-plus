// server/src/controllers/managerDriverController.js

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import { resolveCompanyId } from "../utils/resolveCompanyId.js";

/* ==========================================================
   Helpers
========================================================== */
const sanitizeStr = (v) => (typeof v === "string" ? v.trim() : "");

const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

const ensureDriverInCompany = async ({ companyId, driverId }) => {
  const driver = await User.findOne({
    _id: driverId,
    role: "driver",
    companyId,
  });

  return driver;
};

/* ==========================================================
   ✅ GET ALL DRIVERS (manager scope)
   GET /api/manager/drivers?status=active|inactive&verification=pending|verified|rejected
========================================================== */
export const getManagerDrivers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { status, verification, stage, search = "" } = req.query;

    const filters = {
      role: "driver",
      companyId,
    };

    // Active / inactive filter
    if (status === "active") filters.isActive = true;
    if (status === "inactive") filters.isActive = false;

    // Verification status filter
    if (verification && ["pending", "verified", "rejected"].includes(verification)) {
      filters.driverVerificationStatus = verification;
    }

    // Onboarding stage filter
    if (stage && ["profile_only", "verified", "account_created"].includes(stage)) {
      filters.driverOnboardingStage = stage;
    }

    // Basic search (name/phone/email)
    const q = sanitizeStr(search);
    if (q) {
      filters.$or = [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    // If manager is tied to a shop, you can uncomment to scope to that shop only:
    // if (req.user.shopId) filters.shopId = req.user.shopId;

    const drivers = await User.find(filters)
      .select(
        "name email phone address profileImage isActive driverStatus createdAt shopId " +
          "driverVerificationStatus driverOnboardingStage driverVerification vehicleAssigned"
      )
      .populate("shopId", "name city")
      .populate("vehicleAssigned", "brand model plateNumber type vehicleImage")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    console.error("❌ getManagerDrivers ERROR:", err);
    res.status(500).json({ error: "Server error loading drivers" });
  }
};

/* ==========================================================
   ✅ CREATE DRIVER PROFILE ONLY (NO LOGIN YET)
   POST /api/manager/drivers
   Body: { name, phone, address, profileImage?, shopId? }
========================================================== */
export const createManagerDriverProfile = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { name, phone, address, profileImage, shopId } = req.body;

    if (!sanitizeStr(name)) {
      return res.status(400).json({ error: "Driver full name is required." });
    }

    const driver = await User.create({
      role: "driver",
      companyId,
      shopId: shopId || req.user.shopId || null,
      managerId: req.user._id,

      name: sanitizeStr(name),
      phone: sanitizeStr(phone),
      address: sanitizeStr(address),
      profileImage: sanitizeStr(profileImage),

      // Onboarding defaults (from your new model)
      driverOnboardingStage: "profile_only",
      driverVerificationStatus: "pending",
      isActive: true,
    });

    res.status(201).json({
      ok: true,
      message: "Driver profile created (no login yet).",
      driver,
    });
  } catch (err) {
    console.error("❌ createManagerDriverProfile ERROR:", err);
    res.status(500).json({ error: "Server error creating driver profile" });
  }
};

/* ==========================================================
   ✅ UPDATE DRIVER PROFILE INFO (safe)
   PATCH /api/manager/drivers/:driverId/profile
   - allowed anytime: name, phone, address, profileImage, shopId
   - email/password are NOT set here
========================================================== */
export const updateManagerDriverProfile = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await ensureDriverInCompany({ companyId, driverId });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const allowed = pick(req.body, ["name", "phone", "address", "profileImage", "shopId"]);

    if (allowed.name !== undefined) driver.name = sanitizeStr(allowed.name);
    if (allowed.phone !== undefined) driver.phone = sanitizeStr(allowed.phone);
    if (allowed.address !== undefined) driver.address = sanitizeStr(allowed.address);
    if (allowed.profileImage !== undefined) driver.profileImage = sanitizeStr(allowed.profileImage);
    if (allowed.shopId !== undefined) driver.shopId = allowed.shopId || null;

    await driver.save();

    res.json({
      ok: true,
      message: "Driver profile updated.",
      driver,
    });
  } catch (err) {
    console.error("❌ updateManagerDriverProfile ERROR:", err);
    res.status(500).json({ error: "Server error updating driver profile" });
  }
};

/* ==========================================================
   ✅ SUBMIT / UPDATE DRIVER VERIFICATION DATA (manager fills form)
   PATCH /api/manager/drivers/:driverId/verification
   Body:
   {
     idNumber, idImage,
     vehicleImage, vehiclePlateNumber,
     rejectionReason? (optional)
   }
========================================================== */
export const upsertManagerDriverVerification = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await ensureDriverInCompany({ companyId, driverId });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const { idNumber, idImage, vehicleImage, vehiclePlateNumber } = req.body;

    driver.driverVerification = driver.driverVerification || {};

    if (idNumber !== undefined) driver.driverVerification.idNumber = sanitizeStr(idNumber);
    if (idImage !== undefined) driver.driverVerification.idImage = sanitizeStr(idImage);
    if (vehicleImage !== undefined) driver.driverVerification.vehicleImage = sanitizeStr(vehicleImage);
    if (vehiclePlateNumber !== undefined)
      driver.driverVerification.vehiclePlateNumber = sanitizeStr(vehiclePlateNumber);

    // Anytime verification data is edited -> keep it pending until manager verifies
    driver.driverVerificationStatus = "pending";
    driver.driverVerification.verifiedAt = null;
    driver.driverVerification.verifiedBy = null;
    driver.driverVerification.rejectionReason = "";

    // still profile_only until verified
    if (driver.driverOnboardingStage === "account_created") {
      // if already has account, don’t downgrade stage
    } else {
      driver.driverOnboardingStage = "profile_only";
    }

    await driver.save();

    res.json({
      ok: true,
      message: "Driver verification info saved (pending).",
      driver,
    });
  } catch (err) {
    console.error("❌ upsertManagerDriverVerification ERROR:", err);
    res.status(500).json({ error: "Server error saving verification info" });
  }
};

/* ==========================================================
   🚘 CREATE OR UPDATE VEHICLE FROM DRIVER VERIFICATION
========================================================== */
const upsertVehicleFromDriver = async ({ driver }) => {
  const verification = driver.driverVerification || {};

  const plate = verification.vehiclePlateNumber?.trim();
  if (!plate) return null;

  const payload = {
    companyId: driver.companyId,
    shopId: driver.shopId || null,
    driverId: driver._id,

    type: "car", // default (can be extended later)
    brand: verification.vehicleBrand || "Unknown",
    model: verification.vehicleModel || "Unknown",
    plateNumber: plate,

    vehicleImage: verification.vehicleImage || null,
    driverCertificate: verification.idImage,

    status: "active",
  };

  const vehicle = await Vehicle.findOneAndUpdate(
    { driverId: driver._id },
    {
      $set: payload,
      $setOnInsert: { createdFromDriver: true },
    },
    {
      new: true,
      upsert: true,
    }
  );

  return vehicle;
};


/* ==========================================================
   ✅ VERIFY DRIVER (manager action)
   PATCH /api/manager/drivers/:driverId/verify
========================================================== */
export const verifyManagerDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await ensureDriverInCompany({ companyId, driverId });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Require minimum verification fields
    const idNum = sanitizeStr(driver.driverVerification?.idNumber);
    const idImg = sanitizeStr(driver.driverVerification?.idImage);
    const plate = sanitizeStr(driver.driverVerification?.vehiclePlateNumber);

    if (!idNum || !idImg || !plate) {
      return res.status(400).json({
        error:
          "Cannot verify: idNumber, idImage, and vehiclePlateNumber are required.",
      });
    }

    driver.driverVerificationStatus = "verified";
    driver.driverOnboardingStage =
      driver.driverOnboardingStage === "account_created"
        ? "account_created"
        : "verified";

    driver.driverVerification.verifiedAt = new Date();
    driver.driverVerification.verifiedBy = req.user._id;
    driver.driverVerification.rejectionReason = "";

await driver.save();

/* ==========================================================
   🚘 CREATE / UPDATE VEHICLE
========================================================== */
const vehicle = await upsertVehicleFromDriver({ driver });

res.json({
  ok: true,
  message: "Driver verified successfully.",
  driver,
  vehicle, // 👈 returned for frontend if needed
});
  } catch (err) {
    console.error("❌ verifyManagerDriver ERROR:", err);
    res.status(500).json({ error: "Server error verifying driver" });
  }
};

/* ==========================================================
   ✅ REJECT DRIVER (manager action)
   PATCH /api/manager/drivers/:driverId/reject
   Body: { reason }
========================================================== */
export const rejectManagerDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;
    const { reason = "" } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await ensureDriverInCompany({ companyId, driverId });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    driver.driverVerificationStatus = "rejected";
    driver.driverOnboardingStage =
      driver.driverOnboardingStage === "account_created"
        ? "account_created"
        : "profile_only";

    driver.driverVerification = driver.driverVerification || {};
    driver.driverVerification.rejectionReason = sanitizeStr(reason);
    driver.driverVerification.verifiedAt = null;
    driver.driverVerification.verifiedBy = null;

    await driver.save();

    res.json({
      ok: true,
      message: "Driver rejected.",
      driver,
    });
  } catch (err) {
    console.error("❌ rejectManagerDriver ERROR:", err);
    res.status(500).json({ error: "Server error rejecting driver" });
  }
};

/* ==========================================================
   ✅ CREATE DRIVER LOGIN (ONLY AFTER VERIFIED)
   POST /api/manager/drivers/:driverId/create-account
   Body: { email, password }
   - You can later auto-generate password if you want.
========================================================== */
export const createManagerDriverAccount = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;
    const { email, password } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await ensureDriverInCompany({ companyId, driverId });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    if (driver.driverVerificationStatus !== "verified") {
      return res.status(400).json({
        error: "Driver must be verified before creating an account.",
      });
    }

    if (!sanitizeStr(email) || !sanitizeStr(password)) {
      return res.status(400).json({
        error: "Email and password are required to create the driver account.",
      });
    }

    const newEmail = sanitizeStr(email).toLowerCase();

    const exists = await User.findOne({ email: newEmail });
    if (exists && String(exists._id) !== String(driver._id)) {
      return res.status(400).json({ error: "Email is already in use." });
    }

    const hash = await bcrypt.hash(password, 10);

    driver.email = newEmail;
    driver.passwordHash = hash;
    driver.driverOnboardingStage = "account_created";

    await driver.save();

    res.json({
      ok: true,
      message: "Driver account created successfully (login enabled).",
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        driverOnboardingStage: driver.driverOnboardingStage,
        driverVerificationStatus: driver.driverVerificationStatus,
      },
    });
  } catch (err) {
    console.error("❌ createManagerDriverAccount ERROR:", err);
    res.status(500).json({ error: "Server error creating driver account" });
  }
};

/* ==========================================================
   🔁 TOGGLE DRIVER ACTIVE/INACTIVE
   PATCH /api/manager/drivers/:driverId/toggle
========================================================== */
export const toggleManagerDriverStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await ensureDriverInCompany({ companyId, driverId });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    driver.isActive = !driver.isActive;
    await driver.save();

    res.json({
      ok: true,
      message: `Driver is now ${driver.isActive ? "active" : "inactive"}`,
      driver,
    });
  } catch (err) {
    console.error("❌ toggleManagerDriverStatus ERROR:", err);
    res.status(500).json({ error: "Server error updating driver status" });
  }
};

/* ==========================================================
   📊 DRIVER PERFORMANCE STATS
   GET /api/manager/drivers/:driverId/stats
========================================================== */
export const getManagerDriverStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      companyId,
    }).select("name email profileImage isActive createdAt driverStatus");

    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const deliveredTrips = await Trip.find({ driverId, status: "delivered" });
    const totalDelivered = deliveredTrips.length;

    const activeTrips = await Trip.countDocuments({
      driverId,
      status: { $in: ["assigned", "in_progress", "on_trip"] },
    });

    const totalDistance =
      deliveredTrips.reduce((sum, t) => sum + (t.totalDistance || 0), 0) || 0;

    res.json({
      ok: true,
      driver,
      stats: {
        delivered: totalDelivered,
        activeTrips,
        totalDistance,
      },
    });
  } catch (err) {
    console.error("❌ getManagerDriverStats ERROR:", err);
    res.status(500).json({ error: "Server error fetching driver stats" });
  }
};
