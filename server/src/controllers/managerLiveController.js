// server/src/controllers/managerLiveController.js

import User from "../models/User.js";
import Trip from "../models/Trip.js";

/* ==========================================================
   Resolve companyId safely
========================================================== */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   🟦 1. GET LIVE DRIVERS (MAP + LIST)
   GET /api/manager/live/drivers
========================================================== */
export const getManagerLiveDrivers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve company",
      });
    }

    const drivers = await User.find({
      role: "driver",
      companyId,
      isActive: true,
      isSuspended: false,
      driverStatus: { $ne: "offline" },
    })
      .select(
        "name phone driverStatus currentLat currentLng lastSeenAt currentTripId"
      )
      .lean();

    res.json({
      ok: true,
      drivers,
    });
  } catch (err) {
    console.error("❌ getManagerLiveDrivers:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to load live drivers",
    });
  }
};

/* ==========================================================
   🟩 2. GET ACTIVE TRIPS (LIVE)
   GET /api/manager/live/trips
========================================================== */
export const getManagerLiveTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve company",
      });
    }

    const trips = await Trip.find({
      companyId,
      status: { $in: ["assigned", "in_progress"] },
    })
      .populate("driverId", "name phone currentLat currentLng")
      .populate("customerId", "name phone")
      .select(
        "driverId customerId pickupLocation dropoffLocation status startTime createdAt"
      )
      .lean();

    res.json({
      ok: true,
      trips,
    });
  } catch (err) {
    console.error("❌ getManagerLiveTrips:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to load live trips",
    });
  }
};
