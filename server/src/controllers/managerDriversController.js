import bcrypt from "bcryptjs";
import Driver from "../models/Driver.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";

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
   CREATE DRIVER PROFILE
========================================================== */


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
   SUBMIT VERIFICATION (🔥 FINAL FIX)
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

    const {
      idNumber,
      plateNumber,
      vehicleType,
      brand,
      model,
    } = req.body;

    if (!sanitize(idNumber) || !sanitize(plateNumber)) {
      return res.status(400).json({
        ok: false,
        error: "ID number and plate number are required.",
      });
    }

    if (!sanitize(vehicleType) || !sanitize(brand) || !sanitize(model)) {
      return res.status(400).json({
        ok: false,
        error: "Vehicle type, brand and model are required.",
      });
    }

    if (!req.files?.idImage?.[0] || !req.files?.vehicleImage?.[0]) {
      return res.status(400).json({
        ok: false,
        error: "ID image and vehicle image are required.",
      });
    }

    /* FILES */
    const idImage = `/uploads/drivers/id/${req.files.idImage[0].filename}`;
    const vehicleImage = `/uploads/drivers/vehicle/${req.files.vehicleImage[0].filename}`;

    /* UPDATE DRIVER */
    driver.verification = {
      idNumber: sanitize(idNumber),
      idImage,
      status: "verified",
      verifiedAt: new Date(),
      verifiedBy: req.user._id,
      rejectReason: "",
    };

    driver.vehicle = {
      plateNumber: sanitize(plateNumber),
      image: vehicleImage,
      type: sanitize(vehicleType),
    };

    await driver.save();

    /* 🚘 CREATE VEHICLE DOCUMENT */
    const vehicle = await Vehicle.create({
      companyId: driver.companyId,
      shopId: driver.shopId || null,
      driverId: driver.userId || driver._id,

      createdFromDriver: true,

      type: sanitize(vehicleType),
      brand: sanitize(brand),
      model: sanitize(model),
      plateNumber: sanitize(plateNumber),

      vehicleImage,
      driverCertificate: idImage,

      status: "active",
    });

    res.json({
      ok: true,
      message: "Driver verified and vehicle created.",
      driver,
      vehicle,
    });
  } catch (err) {
    console.error("submitDriverVerification error:", err);
    res.status(500).json({
      ok: false,
      error: "Server error submitting verification",
    });
  }
};

/* ==========================================================
   CREATE DRIVER ACCOUNT
========================================================== */
/* ==========================================================
   CREATE DRIVER PROFILE (FIXED)
========================================================== */
export const createDriverProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Driver name is required" });
    }

    const driver = await Driver.create({
      name: name.trim(),
      phone: phone?.trim() || "",
      address: address?.trim() || "",

      managerId: req.user._id,          // ✅ REQUIRED
      companyId: req.user.companyId,    // ✅ REQUIRED (if in schema)

      status: "offline",

      verification: {
        status: "pending",
      },

      hasAccount: false,
      isSuspended: false,
    });

    res.status(201).json({
      ok: true,
      driver,
    });
  } catch (err) {
    console.error("createDriverProfile error:", err);
    res.status(500).json({
      error: "Failed to create driver",
      details: err.message,
    });
  }
};
export const deleteDriverPermanently = async (req, res) => {
  try {
    const { id } = req.params;

    await Driver.findByIdAndDelete(id);

    res.json({
      ok: true,
      message: "Driver permanently deleted",
    });
  } catch (err) {
    console.error("deleteDriverPermanently error:", err);
    res.status(500).json({ error: "Failed to delete driver" });
  }
};
export const getManagerDriversByShop = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    const drivers = await Driver.find({ shopId });

    res.json({
      ok: true,
      drivers,
    });
  } catch (err) {
    console.error("getManagerDriversByShop error:", err);
    res.status(500).json({ error: "Failed to load drivers by shop" });
  }
};

/* ==========================
   REJECT DRIVER
========================== */
export const rejectDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    driver.status = "rejected";
    await driver.save();

    res.json({ ok: true, driver });
  } catch (err) {
    console.error("rejectDriver error:", err);
    res.status(500).json({ error: "Failed to reject driver" });
  }
};

/* ==========================
   TOGGLE DRIVER SUSPEND
========================== */
export const toggleDriverSuspend = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    driver.isSuspended = !driver.isSuspended;
    await driver.save();

    res.json({
      ok: true,
      isSuspended: driver.isSuspended,
      driver,
    });
  } catch (err) {
    console.error("toggleDriverSuspend error:", err);
    res.status(500).json({ error: "Failed to toggle suspension" });
  }
};
export const verifyDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    driver.verification.status = "verified";
    driver.verification.verifiedAt = new Date();
    driver.status = "offline";

    await driver.save();

    res.json({
      ok: true,
      driver,
    });
  } catch (err) {
    console.error("verifyDriver error:", err);
    res.status(500).json({ error: "Failed to verify driver" });
  }
};


export const createDriverAccount = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    if (driver.verification?.status !== "verified") {
      return res.status(400).json({
        error: "Driver is not verified yet",
      });
    }

    if (driver.hasAccount) {
      return res.status(400).json({
        error: "Driver account already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: "driver",
      companyId: driver.companyId,
      driverId: driver._id,
    });

    driver.userId = user._id;
    driver.hasAccount = true;
    await driver.save();

    res.json({
      ok: true,
      message: "Driver account created",
    });
  } catch (err) {
    console.error("createDriverAccount error:", err);
    res.status(500).json({ error: "Failed to create driver account" });
  }
};

