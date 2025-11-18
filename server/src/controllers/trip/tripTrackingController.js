// server/src/controllers/trip/tripTrackingController.js
import Trip from "../../models/Trip.js";
import { TRIP_STATUS_EVENT } from "./tripHelpers.js";
import { broadcastTripStatus } from "./tripHelpers.js";

/* ==========================================================
   🛰️ 2. Update Driver Location (Route Tracking)
   (NO activity log to avoid huge logs)
   ========================================================== */
export const updateDriverLocation = async (req, res) => {
  try {
    const { tripId, lat, lng } = req.body;

    if (!tripId || !lat || !lng) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    trip.routeHistory.push({ lat, lng, timestamp: new Date() });

    if (trip.status === "assigned") trip.status = "in_progress";

    await trip.save();

    // 🔁 Realtime broadcast
    await broadcastTripStatus(req, trip._id);

    res.json({
      ok: true,
      message: "Driver location updated",
      routeCount: trip.routeHistory.length,
    });
  } catch (err) {
    console.error("❌ Location update error:", err.message);
    res.status(500).json({
      error: "Server error updating location",
    });
  }
};

/* ==========================================================
   📋 4. Driver — get active trips
   ========================================================== */
export const getDriverActiveTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      driverId: req.user._id,
      status: { $in: ["assigned", "in_progress"] },
    })
      .sort({ createdAt: -1 })
      .populate("vehicleId customerId companyId");

    res.json({
      ok: true,
      count: trips.length,
      trips,
    });
  } catch (err) {
    console.error("❌ Fetch active trips error:", err.message);
    res.status(500).json({
      error: "Error fetching active trips",
    });
  }
};

/* ==========================================================
   🌍 5. Route history (Company / Manager / Owner / Superadmin)
   ========================================================== */
export const getRouteHistory = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip)
      return res.status(404).json({ error: "Trip not found" });

    res.json({
      ok: true,
      route: trip.routeHistory,
      totalPoints: trip.routeHistory.length,
    });
  } catch (err) {
    console.error("❌ Route history error:", err.message);
    res.status(500).json({
      error: "Failed to load route history",
    });
  }
};

/* ==========================================================
   🛰️ 9. Customer — Live Tracking
   ========================================================== */
export const getCustomerLiveTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({
      _id: tripId,
      customerId: req.user._id,
    })
      .populate("driverId", "name email profileImage phone")
      .populate(
        "vehicleId",
        "type brand model plateNumber status vehicleImage"
      )
      .populate("companyId", "name email companyName");

    if (!trip)
      return res.status(404).json({
        error: "Trip not found or unauthorized",
      });

    res.json({
      ok: true,
      tripId: trip._id,
      status: trip.status,
      liveStatus: trip.liveStatus || null,
      pickupLocation: trip.pickupLocation,
      dropoffLocation: trip.dropoffLocation,
      routeHistory: trip.routeHistory,
      driver: trip.driverId,
      vehicle: trip.vehicleId,
      totalRoutePoints: trip.routeHistory.length,
      startTime: trip.startTime,
      endTime: trip.endTime,
    });
  } catch (err) {
    console.error("❌ Live tracking error:", err.message);
    res.status(500).json({
      error: "Server error loading live tracking",
    });
  }
};

/* ==========================================================
   7E — DRIVER SENDS LIVE STATUS UPDATE
   (Not logged to avoid noise)
   ========================================================== */
export const updateLiveStatus = async (req, res) => {
  try {
    const { tripId, status } = req.body;

    if (!tripId || !status) {
      return res.status(400).json({
        error: "tripId and status are required",
      });
    }

    const trip = await Trip.findById(tripId)
      .populate("customerId", "name email")
      .populate("companyId", "name")
      .populate("driverId", "name email profileImage");

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    trip.liveStatus = status;
    await trip.save();

    const io = req.app.get("io");
    const payload = {
      tripId: trip._id,
      status: trip.status,
      liveStatus: status,
      driver: trip.driverId,
      customer: trip.customerId,
      company: trip.companyId,
      timestamp: new Date(),
    };

    if (io) {
      if (trip.customerId?._id) {
        io.to(String(trip.customerId._id)).emit(TRIP_STATUS_EVENT, payload);
      }
      if (trip.companyId?._id) {
        io.to(String(trip.companyId._id)).emit(TRIP_STATUS_EVENT, payload);
      }
      if (trip.driverId?._id) {
        io.to(String(trip.driverId._id)).emit(TRIP_STATUS_EVENT, payload);
      }
    }

    res.json({
      ok: true,
      message: "Live status updated successfully",
      payload,
    });
  } catch (err) {
    console.error("❌ Live status update error:", err.message);
    res.status(500).json({ error: "Server error updating live status" });
  }
};
