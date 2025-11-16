// server/src/controllers/superAdminTripController.js

import Trip from "../models/Trip.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";

/* ==========================================================
   📌 SUPERADMIN — LIST ALL TRIPS (Read-Only)
========================================================== */
export const superAdminListTrips = async (req, res) => {
  try {
    const {
      status,
      companyId,
      driverId,
      customerId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 30,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (companyId) filter.companyId = companyId;
    if (driverId) filter.driverId = driverId;
    if (customerId) filter.customerId = customerId;

    // DATE RANGE
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // TEXT SEARCH
    if (search) {
      filter.$or = [
        { "pickupLocation.address": { $regex: search, $options: "i" } },
        { "dropoffLocation.address": { $regex: search, $options: "i" } },
        { customerNotes: { $regex: search, $options: "i" } },
        { _id: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, trips] = await Promise.all([
      Trip.countDocuments(filter),
      Trip.find(filter)
        .populate("driverId", "name email phone profileImage")
        .populate("vehicleId", "brand model plateNumber status")
        .populate("customerId", "name email phone")
        .populate("companyId", "name email companyName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
    ]);

    res.json({
      ok: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      trips,
    });
  } catch (err) {
    console.error("❌ SuperAdmin trip list error:", err.message);
    res.status(500).json({ error: "Server error loading trip list" });
  }
};

/* ==========================================================
   📌 SUPERADMIN — GET TRIP BY ID (Read-Only)
========================================================== */
export const superAdminGetSingleTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .populate("driverId", "name email phone profileImage")
      .populate("vehicleId", "brand model plateNumber status vehicleImage")
      .populate("customerId", "name email phone")
      .populate("companyId", "name email companyName");

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json({ ok: true, trip });
  } catch (err) {
    console.error("❌ SuperAdmin get trip error:", err.message);
    res.status(500).json({ error: "Server error loading trip" });
  }
};
