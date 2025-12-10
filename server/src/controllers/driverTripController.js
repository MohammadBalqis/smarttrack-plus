import Trip from "../models/Trip.js";
import GlobalSettings from "../models/GlobalSettings.js";
import { io } from "../../server.js";
import { logActivity } from "../utils/activityLogger.js";
import { createDriverNotification } from "./driverNotificationController.js";

/* ==========================================================
   🛡 MAINTENANCE GUARD
========================================================== */
const ensureNotInMaintenance = async (req, res) => {
  const settings = await GlobalSettings.findOne();
  if (settings?.maintenanceMode && req.user.role !== "superadmin") {
    res
      .status(503)
      .json({ ok: false, error: "System is under maintenance." });
    return false;
  }
  return true;
};

/* ==========================================================
   📋 D8.10 — LIST DRIVER TRIPS (history + filters)
========================================================== */
export const getDriverTrips = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    if (req.user.role !== "driver") {
      return res.status(403).json({
        ok: false,
        error: "Only drivers can view driver trips.",
      });
    }

    const driverId = req.user._id;

    let {
      status = "all",
      from,
      to,
      page = 1,
      limit = 10,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;
    if (limit > 100) limit = 100;

    const filter = { driverId };

    if (status && status !== "all") {
      const allowed = [
        "pending",
        "assigned",
        "in_progress",
        "delivered",
        "cancelled",
      ];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          ok: false,
          error: "Invalid status filter.",
        });
      }
      filter.status = status;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const f = new Date(from);
        if (!isNaN(f.getTime())) filter.createdAt.$gte = f;
      }
      if (to) {
        const t = new Date(to);
        if (!isNaN(t.getTime())) {
          t.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = t;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const skip = (page - 1) * limit;

    const [total, trips] = await Promise.all([
      Trip.countDocuments(filter),
      Trip.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("companyId", "name")
        .populate("customerId", "name phone")
        .populate("vehicleId", "brand model plateNumber"),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    const statusStats = await Trip.aggregate([
      { $match: { driverId, ...(filter.createdAt ? { createdAt: filter.createdAt } : {}) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statsMap = statusStats.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    return res.json({
      ok: true,
      trips,
      page,
      limit,
      total,
      totalPages,
      filters: { status, from: from || null, to: to || null },
      stats: {
        pending: statsMap.pending || 0,
        assigned: statsMap.assigned || 0,
        in_progress: statsMap.in_progress || 0,
        delivered: statsMap.delivered || 0,
        cancelled: statsMap.cancelled || 0,
      },
    });
  } catch (err) {
    console.error("getDriverTrips error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error loading driver trips." });
  }
};

/* ==========================================================
   📌 D7.1 — DRIVER ACTIVE TRIP
========================================================== */
export const getDriverActiveTrip = async (req, res) => {
  try {
    if (req.user.role !== "driver") {
      return res
        .status(403)
        .json({ ok: false, error: "Only drivers allowed." });
    }

    const driverId = req.user._id;

    const trip = await Trip.findOne({
      driverId,
      status: { $in: ["assigned", "in_progress"] },
    })
      .populate("companyId", "name")
      .populate("customerId", "name phone")
      .populate("vehicleId", "brand model plateNumber")
      .sort({ createdAt: -1 });

    return res.json({ ok: true, trip: trip || null });
  } catch (err) {
    console.error("getDriverActiveTrip error:", err);
    res
      .status(500)
      .json({ ok: false, error: "Server error fetching active trip." });
  }
};

/* ==========================================================
   📌 D7.2 — UPDATE TRIP STATUS
========================================================== */
export const updateDriverTripStatus = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    if (req.user.role !== "driver") {
      return res.status(403).json({ ok: false, error: "Only drivers allowed." });
    }

    const driverId = req.user._id;
    const { tripId } = req.params;
    const { status, liveStatus } = req.body;

    const allowed = ["assigned", "in_progress", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status." });
    }

    const trip = await Trip.findOne({ _id: tripId, driverId });
    if (!trip) {
      return res.status(404).json({ ok: false, error: "Trip not found for this driver." });
    }

    if (["delivered", "cancelled"].includes(trip.status)) {
      return res.status(400).json({ ok: false, error: `Trip already ${trip.status}.` });
    }

    if (status === "delivered" && trip.status !== "in_progress") {
      return res.status(400).json({
        ok: false,
        error: "Cannot mark delivered before trip is in progress.",
      });
    }

    trip.status = status;

    if (status === "in_progress" && !trip.startTime) trip.startTime = new Date();
    if (status === "delivered" && !trip.endTime) trip.endTime = new Date();

    trip.liveStatus =
      liveStatus ||
      (status === "assigned"
        ? "Driver assigned"
        : status === "in_progress"
        ? "On the way to customer"
        : status === "delivered"
        ? "Delivered (awaiting customer confirmation)"
        : "Trip cancelled");

    await trip.save();

    await createDriverNotification(driverId, {
      type: "trip_status_update",
      message: `Trip status updated to "${trip.status}".`,
      tripId: trip._id,
    });

    io.to(`trip:${trip._id}`).emit("trip:status_update", {
      tripId: String(trip._id),
      status: trip.status,
      liveStatus: trip.liveStatus,
      timestamp: Date.now(),
    });

    if (trip.companyId) {
      io.to(`company_${trip.companyId}`).emit("trip:driver_status_changed", {
        tripId: String(trip._id),
        driverId: String(driverId),
        status: trip.status,
        liveStatus: trip.liveStatus,
      });
    }

    io.to(`driver_${driverId}`).emit("trip:driver_status_changed:self", {
      tripId: String(trip._id),
      status: trip.status,
      liveStatus: trip.liveStatus,
    });

    await logActivity({
      userId: driverId,
      action: "DRIVER_TRIP_STATUS_UPDATE",
      description: `Driver updated trip ${trip._id} to ${trip.status}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    return res.json({ ok: true, message: "Status updated.", trip });
  } catch (err) {
    console.error("updateDriverTripStatus error:", err);
    res
      .status(500)
      .json({ ok: false, error: "Server error updating trip." });
  }
};

/* ==========================================================
   📌 D7.4 — CONFIRM DELIVERY BY QR
========================================================== */
export const confirmTripByQr = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    if (req.user.role !== "driver") {
      return res.status(403).json({ ok: false, error: "Only drivers allowed." });
    }

    const driverId = req.user._id;
    const { qrData } = req.body;

    if (!qrData)
      return res.status(400).json({ ok: false, error: "QR data is required." });

    let payload;
    try {
      payload = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid QR data format." });
    }

    if (!payload.tripId)
      return res.status(400).json({ ok: false, error: "QR missing tripId." });

    const trip = await Trip.findOne({
      _id: payload.tripId,
      driverId,
    });

    if (!trip)
      return res.status(404).json({ ok: false, error: "Trip not found for this driver." });

    if (trip.status === "delivered")
      return res.status(400).json({ ok: false, error: "Trip already delivered." });

    if (["pending", "assigned"].includes(trip.status)) {
      return res.status(400).json({
        ok: false,
        error: "Cannot confirm delivery before trip is in progress.",
      });
    }

    trip.status = "delivered";
    trip.liveStatus = "Delivered (awaiting customer confirmation)";
    if (!trip.endTime) trip.endTime = new Date();

    await trip.save();

    await createDriverNotification(driverId, {
      type: "trip_delivered_qr",
      message: `Delivery confirmed via QR for trip ${trip._id}.`,
      tripId: trip._id,
    });

    io.to(`trip:${trip._id}`).emit("trip:status_update", {
      tripId: String(trip._id),
      status: trip.status,
      liveStatus: trip.liveStatus,
    });

    io.to(`company_${trip.companyId}`).emit("trip:driver_status_changed", {
      tripId: String(trip._id),
      driverId: String(driverId),
      status: trip.status,
      liveStatus: trip.liveStatus,
    });

    await logActivity({
      userId: driverId,
      action: "DRIVER_TRIP_CONFIRMED_BY_QR",
      description: `Driver confirmed delivery for trip ${trip._id} via QR`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    return res.json({
      ok: true,
      message: "Delivery confirmed via QR successfully.",
      trip,
    });
  } catch (err) {
    console.error("confirmTripByQr error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error confirming QR." });
  }
};

/* ==========================================================
   ACCEPT TRIP
========================================================== */
export const acceptTrip = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    if (req.user.role !== "driver") {
      return res.status(403).json({ ok: false, error: "Only drivers allowed." });
    }

    const driverId = req.user._id;
    const { tripId } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip)
      return res.status(404).json({ ok: false, error: "Trip not found" });

    if (trip.status !== "pending") {
      return res.status(400).json({
        ok: false,
        error: "Trip is not available",
      });
    }

    trip.status = "assigned";
    trip.driverId = driverId;
    await trip.save();

    await createDriverNotification(driverId, {
      type: "trip_accepted",
      message: `You accepted trip ${trip._id}.`,
      tripId: trip._id,
    });

    io.to(String(trip.companyId)).emit("trip-updated", trip);

    res.json({ ok: true, trip });
  } catch (err) {
    console.error("acceptTrip error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};

/* ==========================================================
   DECLINE TRIP
========================================================== */
export const declineTrip = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const driverId = req.user._id;
    const { tripId } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip)
      return res.status(404).json({ ok: false, error: "Trip not found" });

    if (trip.status !== "pending") {
      return res.status(400).json({
        ok: false,
        error: "Trip cannot be declined — it is not pending.",
      });
    }

    trip.status = "declined";
    trip.declinedBy = driverId;
    await trip.save();

    await createDriverNotification(driverId, {
      type: "trip_declined",
      message: `You declined trip ${trip._id}.`,
      tripId: trip._id,
    });

    io.to(String(trip.companyId)).emit("trip-declined", {
      tripId,
      driverId,
    });

    res.json({ ok: true, message: "Trip declined successfully", trip });
  } catch (err) {
    console.error("declineTrip error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};

/* ==========================================================
   📌 D8.11 — SAVE DRIVER LOCATION POINT (route tracking)
========================================================== */
export const saveDriverLocationPoint = async (req, res) => {
  try {
    if (req.user.role !== "driver") {
      return res.status(403).json({ ok: false, error: "Only drivers allowed." });
    }

    const driverId = req.user._id;
    const { tripId } = req.params;
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res
        .status(400)
        .json({ ok: false, error: "lat and lng are required." });
    }

    const trip = await Trip.findOne({ _id: tripId, driverId });
    if (!trip) {
      return res
        .status(404)
        .json({ ok: false, error: "Trip not found for this driver." });
    }

    const point = {
      lat,
      lng,
      timestamp: new Date(),
    };

    trip.routeHistory = trip.routeHistory || [];
    trip.routeHistory.push(point);

    trip.lastLocation = { lat, lng, updatedAt: new Date() };

    await trip.save();

    io.to(`trip:${tripId}`).emit("trip:location_update", {
      tripId,
      lat,
      lng,
      timestamp: point.timestamp,
    });

    if (trip.companyId) {
      io.to(`company_${trip.companyId}`).emit("trip:driver_location", {
        tripId,
        lat,
        lng,
        timestamp: point.timestamp,
      });
    }

    return res.json({ ok: true, message: "Location saved.", point });
  } catch (err) {
    console.error("saveDriverLocationPoint error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error saving location." });
  }
};
