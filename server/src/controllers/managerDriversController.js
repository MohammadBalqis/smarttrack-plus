// server/src/controllers/managerDriverController.js

import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import { resolveCompanyId } from "../utils/resolveCompanyId.js";

/* ==========================================================
   📌 GET ALL DRIVERS (with assigned vehicle)
========================================================== */
export const getManagerDrivers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const { status } = req.query; // active | inactive

    const filters = {
      role: "driver",
      companyId,
    };

    if (status === "active") filters.isActive = true;
    if (status === "inactive") filters.isActive = false;

    // Load drivers
    const drivers = await User.find(filters)
      .select("name email phone profileImage isActive onlineStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Get list of driverIds
    const driverIds = drivers.map((d) => d._id);

    // Get vehicles assigned to drivers
    const vehicles = await Vehicle.find({
      driverId: { $in: driverIds },
    })
      .select("brand model plateNumber type vehicleImage driverId")
      .lean();

    // Attach vehicles
    const enriched = drivers.map((driver) => ({
      ...driver,
      assignedVehicle:
        vehicles.find((v) => String(v.driverId) === String(driver._id)) ||
        null,
    }));

    res.json({
      ok: true,
      count: enriched.length,
      drivers: enriched,
    });
  } catch (err) {
    console.error("❌ getManagerDrivers ERROR:", err.message);
    res.status(500).json({ error: "Server error loading drivers" });
  }
};

/* ==========================================================
   ✏ UPDATE DRIVER INFO (name, email, phone)
========================================================== */
export const updateManagerDriver = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;
    const { name, email, phone } = req.body;

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      companyId,
    });

    if (!driver)
      return res.status(404).json({ error: "Driver not found" });

    // Handle email change
    if (email && email !== driver.email) {
      const exists = await User.findOne({ email });
      if (exists)
        return res.status(400).json({ error: "Email is already in use" });

      driver.email = email;
    }

    if (name) driver.name = name;
    if (phone) driver.phone = phone;

    await driver.save();

    const safe = driver.toObject();
    delete safe.passwordHash;

    res.json({
      ok: true,
      message: "Driver updated successfully",
      driver: safe,
    });
  } catch (err) {
    console.error("❌ updateManagerDriver ERROR:", err.message);
    res.status(500).json({ error: "Server error updating driver" });
  }
};

/* ==========================================================
   🔁 TOGGLE DRIVER ACTIVE/INACTIVE
========================================================== */
export const toggleManagerDriverStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      companyId,
    });

    if (!driver)
      return res.status(404).json({ error: "Driver not found" });

    driver.isActive = !driver.isActive;
    await driver.save();

    const safe = driver.toObject();
    delete safe.passwordHash;

    res.json({
      ok: true,
      message: `Driver is now ${driver.isActive ? "active" : "inactive"}`,
      driver: safe,
    });
  } catch (err) {
    console.error("❌ toggleManagerDriverStatus ERROR:", err.message);
    res.status(500).json({ error: "Server error updating driver status" });
  }
};

/* ==========================================================
   📊 DRIVER PERFORMANCE STATS
========================================================== */
export const getManagerDriverStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const driver = await User.findOne({
      _id: driverId,
      role: "driver",
      companyId,
    }).select("name email profileImage isActive createdAt");

    if (!driver)
      return res.status(404).json({ error: "Driver not found" });

    const deliveredTrips = await Trip.find({
      driverId,
      status: "delivered",
    });

    const totalDelivered = deliveredTrips.length;

    const activeTrips = await Trip.countDocuments({
      driverId,
      status: { $in: ["assigned", "in_progress"] },
    });

    const totalDistance =
      deliveredTrips.reduce(
        (sum, t) => sum + (t.totalDistance || 0),
        0
      ) || 0;

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
    console.error("❌ getManagerDriverStats ERROR:", err.message);
    res.status(500).json({ error: "Server error fetching driver stats" });
  }
};

/* ==========================================================
   🕒 RECENT TRIPS (last 20)
========================================================== */
export const getManagerDriverRecentTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { driverId } = req.params;

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const driverExists = await User.exists({
      _id: driverId,
      role: "driver",
      companyId,
    });

    if (!driverExists)
      return res.status(404).json({ error: "Driver not found" });

    const trips = await Trip.find({
      driverId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("vehicleId", "brand model plateNumber")
      .populate("customerId", "name phone");

    res.json({
      ok: true,
      count: trips.length,
      trips,
    });
  } catch (err) {
    console.error("❌ getManagerDriverRecentTrips ERROR:", err.message);
    res.status(500).json({ error: "Server error fetching recent trips" });
  }
};
