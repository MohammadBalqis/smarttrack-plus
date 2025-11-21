// server/src/controllers/companyDriverController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) return user.companyId;
  return null;
};

/* ==========================================================
   📌 GET ALL DRIVERS FOR COMPANY (with optional status filter)
   ========================================================== */
export const getCompanyDrivers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { status } = req.query; // "active", "inactive" or ""

    const query = {
      role: "driver",
      companyId,
    };

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const drivers = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    console.error("❌ getCompanyDrivers error:", err.message);
    res.status(500).json({ error: "Server error fetching drivers" });
  }
};

/* ==========================================================
   ➕ CREATE NEW DRIVER
   ========================================================== */
export const createCompanyDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const driver = await User.create({
      name,
      email,
      passwordHash,
      phoneNumber: phoneNumber || "",
      role: "driver",
      companyId,
      isActive: true,
    });

    const driverSafe = driver.toObject();
    delete driverSafe.passwordHash;

    res.status(201).json({
      ok: true,
      message: "Driver created successfully",
      driver: driverSafe,
    });
  } catch (err) {
    console.error("❌ createCompanyDriver error:", err.message);
    res.status(500).json({ error: "Server error creating driver" });
  }
};

/* ==========================================================
   ✏️ UPDATE DRIVER (name, email, phone)
   ========================================================== */
export const updateCompanyDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;
    const { name, email, phoneNumber } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await User.findOne({
      _id: id,
      role: "driver",
      companyId,
    });

    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    if (email && email !== driver.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: "Email is already in use" });
      }
      driver.email = email;
    }

    if (name) driver.name = name;
    if (phoneNumber !== undefined) driver.phoneNumber = phoneNumber;

    await driver.save();

    const driverSafe = driver.toObject();
    delete driverSafe.passwordHash;

    res.json({
      ok: true,
      message: "Driver updated successfully",
      driver: driverSafe,
    });
  } catch (err) {
    console.error("❌ updateCompanyDriver error:", err.message);
    res.status(500).json({ error: "Server error updating driver" });
  }
};

/* ==========================================================
   🔁 TOGGLE DRIVER ACTIVE / INACTIVE
   ========================================================== */
export const toggleCompanyDriverStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const driver = await User.findOne({
      _id: id,
      role: "driver",
      companyId,
    });

    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    driver.isActive = !driver.isActive;
    await driver.save();

    const driverSafe = driver.toObject();
    delete driverSafe.passwordHash;

    res.json({
      ok: true,
      message: `Driver is now ${driver.isActive ? "active" : "inactive"}`,
      driver: driverSafe,
    });
  } catch (err) {
    console.error("❌ toggleCompanyDriverStatus error:", err.message);
    res.status(500).json({ error: "Server error updating driver status" });
  }
};
/* ==========================================================
   📊 DRIVER STATS (for Manager / Company dashboard)
   ========================================================== */
export const getCompanyDriverStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params; // driverId

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    // Verify driver belongs to this company
    const driver = await User.findOne({
      _id: id,
      role: "driver",
      companyId,
    }).select("name email isActive createdAt");

    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const trips = await Trip.find({
      companyId,
      driverId: id,
    }).select("status totalAmount createdAt");

    const totalTrips = trips.length;
    let deliveredTrips = 0;
    let cancelledTrips = 0;
    let revenueGenerated = 0;
    let activeTripsCount = 0;
    let lastTripDate = null;

    const activeStatuses = ["assigned", "in_progress"];

    for (const t of trips) {
      if (t.status === "delivered") {
        deliveredTrips += 1;
        revenueGenerated += t.totalAmount || 0;
      }
      if (t.status === "cancelled") {
        cancelledTrips += 1;
      }
      if (activeStatuses.includes(t.status)) {
        activeTripsCount += 1;
      }

      if (!lastTripDate || t.createdAt > lastTripDate) {
        lastTripDate = t.createdAt;
      }
    }

    res.json({
      ok: true,
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        isActive: driver.isActive,
        createdAt: driver.createdAt,
      },
      stats: {
        totalTrips,
        deliveredTrips,
        cancelledTrips,
        revenueGenerated,
        activeTripsCount,
        lastTripDate,
      },
    });
  } catch (err) {
    console.error("❌ getCompanyDriverStats error:", err.message);
    res.status(500).json({ error: "Server error fetching driver stats" });
  }
};

/* ==========================================================
   🧾 DRIVER RECENT TRIPS
   ========================================================== */
export const getCompanyDriverRecentTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params; // driverId

    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const trips = await Trip.find({
      companyId,
      driverId: id,
    })
      .populate("customerId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentTrips = trips.map((t) => ({
      id: t._id,
      status: t.status,
      totalAmount: t.totalAmount || 0,
      createdAt: t.createdAt,
      pickupAddress: t.pickupLocation?.address || "",
      dropoffAddress: t.dropoffLocation?.address || "",
      customerName: t.customerId?.name || "—",
    }));

    res.json({
      ok: true,
      trips: recentTrips,
    });
  } catch (err) {
    console.error("❌ getCompanyDriverRecentTrips error:", err.message);
    res.status(500).json({ error: "Server error fetching driver trips" });
  }
};
