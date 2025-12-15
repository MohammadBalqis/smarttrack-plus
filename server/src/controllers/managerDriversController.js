import bcrypt from "bcryptjs";
import Driver from "../models/Driver.js";
import User from "../models/User.js";

/* ==========================================================
   HELPERS
========================================================== */
const sanitize = (v) => (typeof v === "string" ? v.trim() : v);

const resolveCompanyId = (user) => user?.companyId || null;

const ensureDriverInManagerScope = async ({ managerId, companyId, driverId }) =>
  Driver.findOne({ _id: driverId, managerId, companyId });

/* ==========================================================
   GET DRIVERS
========================================================== */
export const getManagerDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, drivers });
  } catch (err) {
    console.error("getManagerDrivers error:", err);
    res.status(500).json({ ok: false, error: "Server error loading drivers" });
  }
};

/* ==========================================================
   CREATE DRIVER PROFILE (✅ vehicle initialized)
========================================================== */
export const createDriverProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!sanitize(name)) {
      return res
        .status(400)
        .json({ ok: false, error: "Driver name is required." });
    }

    const driver = await Driver.create({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
      name: sanitize(name),
      phone: sanitize(phone) || "",
      address: sanitize(address) || "",
      status: "offline",
      verification: { status: "draft" },
      vehicle: {}, // ✅ IMPORTANT
    });

    res.status(201).json({ ok: true, driver });
  } catch (err) {
    console.error("createDriverProfile error:", err);
    res.status(500).json({ ok: false, error: "Server error creating driver" });
  }
};

/* ==========================================================
   UPDATE DRIVER PROFILE
========================================================== */
export const updateDriverProfile = async (req, res) => {
  try {
    const driver = await ensureDriverInManagerScope({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
      driverId: req.params.driverId,
    });

    if (!driver) {
      return res.status(404).json({ ok: false, error: "Driver not found." });
    }

    const { name, phone, address } = req.body;

    if (name !== undefined) driver.name = sanitize(name);
    if (phone !== undefined) driver.phone = sanitize(phone) || "";
    if (address !== undefined) driver.address = sanitize(address) || "";

    await driver.save();
    res.json({ ok: true, driver });
  } catch (err) {
    console.error("updateDriverProfile error:", err);
    res.status(500).json({ ok: false, error: "Server error updating driver" });
  }
};

/* ==========================================================
   SUBMIT VERIFICATION (✅ FULLY SAFE)
========================================================== */
export const submitDriverVerification = async (req, res) => {
  try {
    const driver = await ensureDriverInManagerScope({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
      driverId: req.params.driverId,
    });

    if (!driver) {
      return res.status(404).json({ ok: false, error: "Driver not found." });
    }

    const { idNumber, plateNumber, vehicleType } = req.body;

    if (!sanitize(idNumber)) {
      return res.status(400).json({ ok: false, error: "ID number is required." });
    }

    if (!sanitize(plateNumber)) {
      return res.status(400).json({ ok: false, error: "Plate number is required." });
    }

    if (!req.files?.idImage?.[0]) {
      return res.status(400).json({ ok: false, error: "ID image is required." });
    }

    if (!req.files?.vehicleImage?.[0]) {
      return res.status(400).json({ ok: false, error: "Vehicle image is required." });
    }

    /* ---------- SAFETY INITIALIZATION ---------- */
    if (!driver.verification) driver.verification = {};
    if (!driver.vehicle) driver.vehicle = {};

    /* ---------- FILE PATHS ---------- */
    const profileImage = req.files?.profileImage?.[0]
      ? `/uploads/drivers/profile/${req.files.profileImage[0].filename}`
      : null;

    const idImage = `/uploads/drivers/id/${req.files.idImage[0].filename}`;
    const vehicleImage = `/uploads/drivers/vehicle/${req.files.vehicleImage[0].filename}`;

    /* ---------- SAVE ---------- */
    if (profileImage) driver.profileImage = sanitize(profileImage);

    driver.vehicle.plateNumber = sanitize(plateNumber);
    driver.vehicle.image = sanitize(vehicleImage);
    if (vehicleType !== undefined) driver.vehicle.type = sanitize(vehicleType);

    driver.verification.idNumber = sanitize(idNumber);
    driver.verification.idImage = sanitize(idImage);
    driver.verification.status = "pending";
    driver.verification.rejectReason = "";
    driver.verification.verifiedAt = null;
    driver.verification.verifiedBy = null;

    await driver.save();

    res.json({ ok: true, message: "Verification submitted.", driver });
  } catch (err) {
    console.error("submitDriverVerification error:", err);
    res.status(500).json({ ok: false, error: "Server error submitting verification" });
  }
};

/* ==========================================================
   VERIFY DRIVER
========================================================== */
export const verifyDriver = async (req, res) => {
  try {
    const driver = await ensureDriverInManagerScope({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
      driverId: req.params.driverId,
    });

    if (!driver) {
      return res.status(404).json({ ok: false, error: "Driver not found." });
    }

    if (
      !driver.verification?.idNumber ||
      !driver.verification?.idImage ||
      !driver.vehicle?.plateNumber ||
      !driver.vehicle?.image
    ) {
      return res.status(400).json({
        ok: false,
        error: "Driver verification is incomplete.",
      });
    }

    driver.verification.status = "verified";
    driver.verification.verifiedAt = new Date();
    driver.verification.verifiedBy = req.user._id;
    driver.verification.rejectReason = "";

    await driver.save();
    res.json({ ok: true, message: "Driver verified.", driver });
  } catch (err) {
    console.error("verifyDriver error:", err);
    res.status(500).json({ ok: false, error: "Server error verifying driver" });
  }
};

/* ==========================================================
   REJECT DRIVER
========================================================== */
export const rejectDriver = async (req, res) => {
  try {
    const driver = await ensureDriverInManagerScope({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
      driverId: req.params.driverId,
    });

    if (!driver) {
      return res.status(404).json({ ok: false, error: "Driver not found." });
    }

    if (!driver.verification) driver.verification = {};

    driver.verification.status = "rejected";
    driver.verification.rejectReason = sanitize(req.body.reason) || "Rejected";
    driver.verification.verifiedAt = null;
    driver.verification.verifiedBy = null;

    await driver.save();
    res.json({ ok: true, message: "Driver rejected.", driver });
  } catch (err) {
    console.error("rejectDriver error:", err);
    res.status(500).json({ ok: false, error: "Server error rejecting driver" });
  }
};

/* ==========================================================
   CREATE DRIVER ACCOUNT
========================================================== */
export const createDriverAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    const driver = await ensureDriverInManagerScope({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
      driverId: req.params.driverId,
    });

    if (!driver) {
      return res.status(404).json({ ok: false, error: "Driver not found." });
    }

    if (driver.verification?.status !== "verified") {
      return res
        .status(400)
        .json({ ok: false, error: "Driver must be verified first." });
    }

    const normalizedEmail = sanitize(email).toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ ok: false, error: "Email already in use." });
    }

    const user = await User.create({
      name: driver.name,
      email: normalizedEmail,
      role: "driver",
      companyId: driver.companyId,
      managerId: driver.managerId,
      isActive: true,
      passwordHash: await bcrypt.hash(password, 10),
    });

    driver.userId = user._id;
    driver.email = normalizedEmail;
    driver.hasAccount = true;

    await driver.save();
    res.json({ ok: true, message: "Driver account created.", driver });
  } catch (err) {
    console.error("createDriverAccount error:", err);
    res.status(500).json({ ok: false, error: "Server error creating account" });
  }
};

/* ==========================================================
   TOGGLE SUSPEND
========================================================== */
export const toggleDriverSuspend = async (req, res) => {
  try {
    const driver = await ensureDriverInManagerScope({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
      driverId: req.params.driverId,
    });

    if (!driver) {
      return res.status(404).json({ ok: false, error: "Driver not found." });
    }

    driver.status = driver.status === "suspended" ? "offline" : "suspended";
    await driver.save();

    res.json({ ok: true, driver });
  } catch (err) {
    console.error("toggleDriverSuspend error:", err);
    res.status(500).json({ ok: false, error: "Server error toggling suspend" });
  }
};

/* ==========================================================
   DELETE DRIVER
========================================================== */
export const deleteDriverPermanently = async (req, res) => {
  try {
    const driver = await ensureDriverInManagerScope({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
      driverId: req.params.driverId,
    });

    if (!driver) {
      return res.status(404).json({ ok: false, error: "Driver not found." });
    }

    if (driver.userId) {
      await User.deleteOne({ _id: driver.userId });
    }

    await Driver.deleteOne({ _id: driver._id });

    res.json({ ok: true, message: "Driver deleted permanently." });
  } catch (err) {
    console.error("deleteDriverPermanently error:", err);
    res.status(500).json({ ok: false, error: "Server error deleting driver" });
  }
};

/* ==========================================================
   GET DRIVERS BY SHOP
========================================================== */
export const getManagerDriversByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ ok: false, error: "Shop ID is required" });
    }

    const drivers = await Driver.find({
      managerId: req.user._id,
      companyId: resolveCompanyId(req.user),
      shopId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, count: drivers.length, drivers });
  } catch (err) {
    console.error("getManagerDriversByShop error:", err);
    res.status(500).json({
      ok: false,
      error: "Server error loading shop drivers",
    });
  }
};
