// server/src/controllers/trip/tripTrackingController.js
import Trip from "../../models/Trip.js";
import User from "../../models/User.js";
import {
  broadcastTripStatus,
  createNotification,
  getPopulatedTripForNotify,
} from "./tripHelpers.js";
import { resolveCompanyId } from "../../utils/resolveCompanyId.js";




/* Helper: notify managers/company from this file */
const notifyCompanyManagers = async (
  req,
  companyId,
  notificationProps,
  extraData = {}
) => {
  if (!companyId) return;

  const managers = await User.find({ role: "manager", companyId }).select("_id");
  const targets = managers.length ? managers : [{ _id: companyId }];

  await Promise.all(
    targets.map((m) =>
      createNotification(req, {
        userId: m._id,
        category: notificationProps.category || "company",
        ...notificationProps,
        extraData: notificationProps.extraData || extraData,
      })
    )
  );
};

/* ==========================================================
   🛰️ 2. Update Driver Location (Route Tracking)
   (NO activity log to avoid huge logs)
   ========================================================== */
export const updateDriverLocation = async (req, res) => {
  try {
    const { tripId, lat, lng } = req.body;

    if (!tripId || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const wasAssigned = trip.status === "assigned";

    trip.routeHistory.push({ lat, lng, timestamp: new Date() });

    if (wasAssigned) trip.status = "in_progress";

    await trip.save();

    // If this is the first movement -> driver started trip
    if (wasAssigned) {
      const populatedTrip = await getPopulatedTripForNotify(trip._id);
      const payloadCommon = {
        trip: populatedTrip,
        driver: populatedTrip.driverId,
        vehicle: populatedTrip.vehicleId,
        customer: populatedTrip.customerId,
      };

      // Notify customer
      if (populatedTrip.customerId?._id) {
        await createNotification(req, {
          userId: populatedTrip.customerId._id,
          title: "Driver Started Trip",
          message: "Your driver has started the trip.",
          type: "status",
          category: "customer",
          relatedTripId: populatedTrip._id,
          actionUrl: `/customer/tracking/${populatedTrip._id}`,
          extraData: payloadCommon,
        });
      }

      // Notify managers / company
      await notifyCompanyManagers(
        req,
        populatedTrip.companyId?._id,
        {
          title: "Trip In Progress",
          message: `Driver ${
            populatedTrip.driverId?.name || ""
          } started trip ${populatedTrip._id}.`,
          type: "status",
          category: "company",
          relatedTripId: populatedTrip._id,
          actionUrl: `/company/trips/${populatedTrip._id}`,
        },
        payloadCommon
      );
    }

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

    const normalized = String(status).toLowerCase();
    const payloadCommon = {
      trip,
      driver: trip.driverId,
      customer: trip.customerId,
      company: trip.companyId,
    };

    // 🔔 High-level status notifications (Option A)
    // 1) Driver arrived at pickup
    if (normalized.includes("arrived") && normalized.includes("pickup")) {
      if (trip.customerId?._id) {
        await createNotification(req, {
          userId: trip.customerId._id,
          title: "Driver Arrived",
          message: "Your driver has arrived at the pickup location.",
          type: "status",
          category: "customer",
          relatedTripId: trip._id,
          actionUrl: `/customer/tracking/${trip._id}`,
          extraData: payloadCommon,
        });
      }

      await notifyCompanyManagers(
        req,
        trip.companyId?._id,
        {
          title: "Driver Arrived at Pickup",
          message: `Driver ${
            trip.driverId?.name || ""
          } arrived at pickup for trip ${trip._id}.`,
          type: "status",
          category: "company",
          relatedTripId: trip._id,
          actionUrl: `/company/trips/${trip._id}`,
        },
        payloadCommon
      );
    }

    // 2) Package picked
    else if (normalized.includes("picked")) {
      if (trip.customerId?._id) {
        await createNotification(req, {
          userId: trip.customerId._id,
          title: "Package Picked",
          message: "Your package has been picked by the driver.",
          type: "status",
          category: "customer",
          relatedTripId: trip._id,
          actionUrl: `/customer/tracking/${trip._id}`,
          extraData: payloadCommon,
        });
      }

      await notifyCompanyManagers(
        req,
        trip.companyId?._id,
        {
          title: "Package Picked",
          message: `Package picked for trip ${trip._id}.`,
          type: "status",
          category: "company",
          relatedTripId: trip._id,
          actionUrl: `/company/trips/${trip._id}`,
        },
        payloadCommon
      );
    }

    // 3) En route to dropoff
    else if (
      normalized.includes("en route") ||
      normalized.includes("en-route") ||
      normalized.includes("enroute") ||
      normalized.includes("on the way")
    ) {
      if (trip.customerId?._id) {
        await createNotification(req, {
          userId: trip.customerId._id,
          title: "Driver On The Way",
          message: "Your driver is on the way to the drop-off location.",
          type: "status",
          category: "customer",
          relatedTripId: trip._id,
          actionUrl: `/customer/tracking/${trip._id}`,
          extraData: payloadCommon,
        });
      }
      // no manager notification here to avoid spam
    }

    // 4) Delivered (driver marks delivered)
    else if (normalized.includes("delivered")) {
      if (trip.customerId?._id) {
        await createNotification(req, {
          userId: trip.customerId._id,
          title: "Driver Marked Delivered",
          message:
            "The driver marked your order as delivered. Please confirm if everything is OK.",
          type: "status",
          category: "customer",
          relatedTripId: trip._id,
          actionUrl: `/customer/tracking/${trip._id}`,
          extraData: payloadCommon,
        });
      }

      await notifyCompanyManagers(
        req,
        trip.companyId?._id,
        {
          title: "Driver Marked Delivered",
          message: `Driver ${
            trip.driverId?.name || ""
          } marked trip ${trip._id} as delivered.`,
          type: "status",
          category: "company",
          relatedTripId: trip._id,
          actionUrl: `/company/trips/${trip._id}`,
        },
        payloadCommon
      );
    }

    // Build simple payload for response (clients may use it)
    const payload = {
      tripId: trip._id,
      status: trip.status,
      liveStatus: status,
      driver: trip.driverId,
      customer: trip.customerId,
      company: trip.companyId,
      timestamp: new Date(),
    };

    // 🔁 Realtime broadcast with full payload
    await broadcastTripStatus(req, trip._id);

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
