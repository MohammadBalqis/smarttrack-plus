// server/src/routes/tripRoutes.js
import { Router } from "express";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js"; // 🆕 notifications
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const router = Router();

/* ==========================================================
   🔔 Helpers — Notifications & Socket
   ========================================================== */

// Try to emit on socket.io if available (won't crash if not configured)
const emitToUser = (req, userId, event, payload) => {
  try {
    const io = req.app.get("io");
    if (io && userId) {
      io.to(String(userId)).emit(event, payload);
    }
  } catch (err) {
    console.error("⚠ Socket emit error:", err.message);
  }
};

// Populate trip with full related data for notifications
const getPopulatedTripForNotify = async (tripId) => {
  return Trip.findById(tripId)
    .populate("driverId", "name email phone profileImage")
    .populate(
      "vehicleId",
      "type brand model plateNumber status vehicleImage"
    )
    .populate("customerId", "name email phone")
    .populate("companyId", "name email companyName");
};

// Create notification in DB + emit via socket
// ✅ Supports full Option C fields (image, actionUrl, priority, sound, extraData)
const createNotification = async (
  req,
  {
    userId,
    title,
    message,
    type = "system",
    category = "system",
    relatedTripId,
    image = null,
    actionUrl = null,
    priority = "normal",
    sound = null,
    extra = {},
    extraData,
  }
) => {
  if (!userId) return;

  // Backwards compatibility: if extraData not sent, use extra
  const finalExtraData = extraData ?? extra ?? {};

  const noti = await Notification.create({
    userId,
    title,
    message,
    type,
    category,
    image,
    actionUrl,
    priority,
    sound,
    relatedTripId: relatedTripId || null,
    extraData: finalExtraData,
  });

  emitToUser(req, userId, "notify", {
    _id: noti._id,
    userId,
    title,
    message,
    type,
    category,
    image,
    actionUrl,
    priority,
    sound,
    relatedTripId: relatedTripId || null,
    createdAt: noti.createdAt,
    extraData: finalExtraData,
  });
};

/* ==========================================================
   🟢 1. Create a Trip (Company / Manager creates manually)
   ========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const {
        driverId,
        vehicleId,
        customerId,
        pickupLocation,
        dropoffLocation,
        deliveryFee,
      } = req.body;

      if (!driverId || !vehicleId || !customerId)
        return res.status(400).json({ error: "Missing required fields" });

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      // Validate driver belongs to company
      const driver = await User.findOne({
        _id: driverId,
        role: "driver",
        companyId,
      });

      if (!driver)
        return res.status(400).json({
          error: "Driver not found or does not belong to your company",
        });

      // Validate vehicle belongs to company
      const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });
      if (!vehicle)
        return res.status(400).json({
          error: "Vehicle not found or not part of your company",
        });

      if (vehicle.status === "maintenance")
        return res.status(400).json({
          error: "Vehicle under maintenance — cannot assign",
        });

      // Create trip
      const trip = await Trip.create({
        driverId,
        vehicleId,
        customerId,
        companyId,
        pickupLocation,
        dropoffLocation,
        deliveryFee,
        status: "assigned",
        startTime: new Date(),
      });

      // Mark vehicle in use
      vehicle.status = "in_use";
      vehicle.driverId = driverId;
      await vehicle.save();

      // 🔔 Notifications: driver + customer
      const populatedTrip = await getPopulatedTripForNotify(trip._id);

      const payloadCommon = {
        trip: populatedTrip,
        driver: populatedTrip.driverId,
        vehicle: populatedTrip.vehicleId,
        customer: populatedTrip.customerId,
      };

      // Notify driver
      await createNotification(req, {
        userId: populatedTrip.driverId?._id,
        title: "New Trip Assigned",
        message: `A new delivery has been assigned to you.`,
        type: "assignment",
        category: "driver",
        relatedTripId: populatedTrip._id,
        image: populatedTrip.customerId?.profileImage || null,
        actionUrl: `/driver/trips/${populatedTrip._id}`,
        priority: "high",
        extraData: payloadCommon,
      });

      // Notify customer
      await createNotification(req, {
        userId: populatedTrip.customerId?._id,
        title: "Your Delivery Is On The Way",
        message: `Your order has been confirmed and a driver was assigned.`,
        type: "status",
        category: "customer",
        relatedTripId: populatedTrip._id,
        image: populatedTrip.driverId?.profileImage || null,
        actionUrl: `/customer/tracking/${populatedTrip._id}`,
        extraData: payloadCommon,
      });

      res.status(201).json({
        ok: true,
        message: "Trip created & driver/vehicle assigned",
        trip,
      });
    } catch (err) {
      console.error("❌ Trip creation error:", err.message);
      res.status(500).json({ error: "Server error creating trip" });
    }
  }
);

/* ==========================================================
   🟣 1B. ASSIGN Driver + Vehicle to a Customer Order (Option 2)
   ========================================================== */
router.post(
  "/assign",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { tripId, driverId, vehicleId, deliveryFee } = req.body;

      if (!tripId || !driverId || !vehicleId)
        return res.status(400).json({
          error: "tripId, driverId, vehicleId are required",
        });

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      // Get pending trip
      const trip = await Trip.findOne({ _id: tripId, companyId });
      if (!trip)
        return res.status(404).json({
          error: "Trip not found for your company",
        });

      if (trip.status !== "pending")
        return res.status(400).json({
          error: `Trip cannot be assigned. Current status: ${trip.status}`,
        });

      // Validate driver
      const driver = await User.findOne({
        _id: driverId,
        role: "driver",
        companyId,
      });

      if (!driver)
        return res.status(400).json({
          error: "Driver not found or not part of your company",
        });

      // Validate vehicle
      const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });
      if (!vehicle)
        return res.status(400).json({
          error: "Vehicle not found or not part of your company",
        });

      if (vehicle.status === "maintenance")
        return res.status(400).json({
          error: "Vehicle under maintenance — cannot assign",
        });

      // Assign trip
      trip.driverId = driverId;
      trip.vehicleId = vehicleId;
      trip.status = "assigned";
      trip.startTime = new Date();
      if (typeof deliveryFee === "number") trip.deliveryFee = deliveryFee;
      await trip.save();

      // Update vehicle status
      vehicle.status = "in_use";
      vehicle.driverId = driverId;
      await vehicle.save();

      // 🔔 Notifications (assignment)
      const populatedTrip = await getPopulatedTripForNotify(trip._id);

      const payloadCommon = {
        trip: populatedTrip,
        driver: populatedTrip.driverId,
        vehicle: populatedTrip.vehicleId,
        customer: populatedTrip.customerId,
      };

      await createNotification(req, {
        userId: populatedTrip.driverId?._id,
        title: "New Trip Assigned",
        message: `A new delivery has been assigned to you.`,
        type: "assignment",
        category: "driver",
        relatedTripId: populatedTrip._id,
        image: populatedTrip.customerId?.profileImage || null,
        actionUrl: `/driver/trips/${populatedTrip._id}`,
        priority: "high",
        extraData: payloadCommon,
      });

      await createNotification(req, {
        userId: populatedTrip.customerId?._id,
        title: "Driver Assigned",
        message: `A driver has been assigned to your delivery.`,
        type: "status",
        category: "customer",
        relatedTripId: populatedTrip._id,
        image: populatedTrip.driverId?.profileImage || null,
        actionUrl: `/customer/tracking/${populatedTrip._id}`,
        extraData: payloadCommon,
      });

      res.json({
        ok: true,
        message: "Trip assigned successfully",
        trip,
      });
    } catch (err) {
      console.error("❌ Assign trip error:", err.message);
      res.status(500).json({
        error: "Server error assigning driver/vehicle",
      });
    }
  }
);

/* ==========================================================
   🛰️ 2. Update Driver Location (Route Tracking)
   ========================================================== */
router.post(
  "/update-location",
  protect,
  authorizeRoles("driver"),
  async (req, res) => {
    try {
      const { tripId, lat, lng } = req.body;

      if (!tripId || !lat || !lng)
        return res.status(400).json({ error: "Missing required fields" });

      const trip = await Trip.findById(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      trip.routeHistory.push({ lat, lng, timestamp: new Date() });

      if (trip.status === "assigned") trip.status = "in_progress";

      await trip.save();

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
  }
);

/* ==========================================================
   ✅ 3. Complete Trip (Auto Payment & Free Vehicle)
   ========================================================== */
router.post(
  "/complete",
  protect,
  authorizeRoles("driver", "manager", "company"),
  async (req, res) => {
    try {
      const { tripId, totalDistance } = req.body;

      if (!tripId)
        return res.status(400).json({ error: "Missing tripId" });

      const trip = await Trip.findById(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      trip.status = "delivered";
      trip.endTime = new Date();
      trip.totalDistance = totalDistance || trip.totalDistance;
      trip.paymentStatus = "paid";
      trip.customerConfirmed = true;
      trip.confirmationTime = new Date();

      await trip.save();

      // Free vehicle
      await Vehicle.findByIdAndUpdate(trip.vehicleId, {
        status: "available",
        driverId: null,
      });

      // Auto payment creation
      const exists = await Payment.findOne({ tripId });
      if (!exists) {
        await Payment.create({
          tripId,
          companyId: trip.companyId,
          driverId: trip.driverId,
          customerId: trip.customerId,
          amount: trip.deliveryFee,
          method: "cod",
          status: "paid",
          collectedBy: "driver",
        });
      }

      // 🔔 Notifications on completion
      const populatedTrip = await getPopulatedTripForNotify(trip._id);
      const payloadCommon = {
        trip: populatedTrip,
        driver: populatedTrip.driverId,
        vehicle: populatedTrip.vehicleId,
        customer: populatedTrip.customerId,
      };

      // Notify customer
      await createNotification(req, {
        userId: populatedTrip.customerId?._id,
        title: "Delivery Completed",
        message: "Your delivery has been completed successfully.",
        type: "status",
        category: "customer",
        relatedTripId: populatedTrip._id,
        image: populatedTrip.driverId?.profileImage || null,
        actionUrl: `/customer/tracking/${populatedTrip._id}`,
        extraData: payloadCommon,
      });

      res.json({
        ok: true,
        message: "Trip completed successfully",
        trip,
      });
    } catch (err) {
      console.error("❌ Trip complete error:", err.message);
      res.status(500).json({
        error: "Server error completing trip",
      });
    }
  }
);

/* ==========================================================
   📋 4. Driver — get active trips
   ========================================================== */
router.get(
  "/active",
  protect,
  authorizeRoles("driver"),
  async (req, res) => {
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
  }
);

/* ==========================================================
   🌍 5. Company/Manager — route history
   ========================================================== */
router.get(
  "/:tripId/route",
  protect,
  authorizeRoles("company", "manager", "owner"),
  async (req, res) => {
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
  }
);

/* ==========================================================
   📦 6. List all Trips for Company / Manager / Owner
   ========================================================== */
router.get(
  "/list",
  protect,
  authorizeRoles("company", "manager", "owner"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const trips = await Trip.find({ companyId })
        .populate("driverId", "name email profileImage")
        .populate(
          "vehicleId",
          "type brand model plateNumber status"
        )
        .populate("customerId", "name email phone")
        .sort({ createdAt: -1 });

      res.json({
        ok: true,
        total: trips.length,
        trips,
      });
    } catch (err) {
      console.error("❌ Error fetching trip list:", err.message);
      res.status(500).json({
        error: "Server error fetching trip list",
      });
    }
  }
);

/* ==========================================================
   🟢 7. Generate Secure QR Code for Customer Delivery Confirm
   ========================================================== */
router.get(
  "/:tripId/generate-qr",
  protect,
  authorizeRoles("company", "manager", "driver"),
  async (req, res) => {
    try {
      const { tripId } = req.params;

      const trip = await Trip.findById(tripId);
      if (!trip)
        return res.status(404).json({ error: "Trip not found" });

      const qrToken = jwt.sign(
        {
          tripId,
          customerId: trip.customerId,
          driverId: trip.driverId,
        },
        process.env.QR_SECRET,
        { expiresIn: "10m" }
      );

      const confirmUrl = `${process.env.FRONTEND_URL}/confirm-delivery?token=${qrToken}`;

      const qrImage = await QRCode.toDataURL(confirmUrl);

      res.json({
        ok: true,
        confirmUrl,
        qrImage,
        expiresIn: "10m",
      });
    } catch (err) {
      console.error("❌ QR generation error:", err.message);
      res.status(500).json({
        error: "Server error generating QR",
      });
    }
  }
);

/* ==========================================================
   🟣 8. Confirm Delivery (Customer scan)
   ========================================================== */
router.post("/confirm-delivery", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token)
      return res.status(400).json({ error: "Missing QR token" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.QR_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired QR" });
    }

    const { tripId } = decoded;
    const trip = await Trip.findById(tripId);

    if (!trip)
      return res.status(404).json({ error: "Trip not found" });

    if (trip.status !== "delivered")
      return res.status(400).json({
        error: "Trip must be marked delivered by driver first.",
      });

    trip.customerConfirmed = true;
    trip.confirmationTime = new Date();
    await trip.save();

    await Vehicle.findByIdAndUpdate(trip.vehicleId, {
      status: "available",
    });

    // 🔔 Notify company/manager that customer confirmed
    const populatedTrip = await getPopulatedTripForNotify(trip._id);
    const payloadCommon = {
      trip: populatedTrip,
      driver: populatedTrip.driverId,
      vehicle: populatedTrip.vehicleId,
      customer: populatedTrip.customerId,
    };

    if (populatedTrip.companyId?._id) {
      await createNotification(req, {
        userId: populatedTrip.companyId._id,
        title: "Customer Confirmed Delivery",
        message: "The customer has confirmed the delivery via QR scan.",
        type: "status",
        category: "company",
        relatedTripId: populatedTrip._id,
        actionUrl: `/company/trips/${populatedTrip._id}`,
        extraData: payloadCommon,
      });
    }

    res.json({
      ok: true,
      message: "Customer confirmed delivery successfully!",
      trip,
    });
  } catch (err) {
    console.error("❌ Delivery confirm error:", err.message);
    res.status(500).json({
      error: "Server error confirming delivery",
    });
  }
});

/* ==========================================================
   🛰️ 9. Customer — Live Tracking
   ========================================================== */
router.get(
  "/customer/live/:tripId",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
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
  }
);

/* ==========================================================
   📦 MANAGER — Filtered Orders List (search + filters)
   ========================================================== */
router.get(
  "/manager/search",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const {
        status,
        driverId,
        vehicleId,
        customerId,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const filter = { companyId };

      // STATUS
      if (status) filter.status = status;

      // DRIVER / VEHICLE / CUSTOMER
      if (driverId) filter.driverId = driverId;
      if (vehicleId) filter.vehicleId = vehicleId;
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
          {
            "pickupLocation.address": {
              $regex: search,
              $options: "i",
            },
          },
          {
            "dropoffLocation.address": {
              $regex: search,
              $options: "i",
            },
          },
          { customerNotes: { $regex: search, $options: "i" } },
          { customerPhone: { $regex: search, $options: "i" } },
          { _id: { $regex: search, $options: "i" } },
        ];
      }

      // PAGINATION
      const skip = (page - 1) * limit;

      const [total, trips] = await Promise.all([
        Trip.countDocuments(filter),
        Trip.find(filter)
          .populate("driverId", "name email profileImage")
          .populate("vehicleId", "brand model plateNumber")
          .populate("customerId", "name email")
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
      console.error("❌ Manager search error:", err.message);
      res.status(500).json({ error: "Server error searching orders" });
    }
  }
);

/* ==========================================================
   6D — MANAGER / COMPANY — Cancel a Trip (with reason)
   ========================================================== */
/*
PATCH /api/trip/cancel/:tripId
Body: { "reason": "Customer unreachable" }
*/
router.patch(
  "/cancel/:tripId",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 3) {
        return res.status(400).json({
          error: "A valid cancellation reason is required",
        });
      }

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const trip = await Trip.findOne({ _id: tripId, companyId });

      if (!trip) {
        return res.status(404).json({
          error: "Trip not found for your company",
        });
      }

      // ❌ Cannot cancel if already done
      if (["delivered", "cancelled"].includes(trip.status)) {
        return res.status(400).json({
          error: `Trip cannot be cancelled. Current status: ${trip.status}`,
        });
      }

      // Allowed statuses: pending, assigned, in_progress
      trip.status = "cancelled";
      trip.cancelReason = reason;
      trip.cancelledAt = new Date();

      await trip.save();

      // Free vehicle if assigned
      if (trip.vehicleId) {
        await Vehicle.findByIdAndUpdate(trip.vehicleId, {
          status: "available",
          driverId: null,
        });
      }

      // 🔔 Notifications
      const populatedTrip = await getPopulatedTripForNotify(trip._id);
      const payloadCommon = {
        trip: populatedTrip,
        driver: populatedTrip.driverId,
        vehicle: populatedTrip.vehicleId,
        customer: populatedTrip.customerId,
      };

      // Notify driver
      if (populatedTrip.driverId?._id) {
        await createNotification(req, {
          userId: populatedTrip.driverId._id,
          title: "Trip Cancelled",
          message: `Your assigned trip was cancelled: ${reason}`,
          type: "status",
          category: "driver",
          relatedTripId: populatedTrip._id,
          actionUrl: `/driver/trips/${populatedTrip._id}`,
          extraData: payloadCommon,
        });
      }

      // Notify customer
      if (populatedTrip.customerId?._id) {
        await createNotification(req, {
          userId: populatedTrip.customerId._id,
          title: "Your Delivery Was Cancelled",
          message: `Your delivery was cancelled: ${reason}`,
          type: "status",
          category: "customer",
          relatedTripId: populatedTrip._id,
          actionUrl: `/customer/tracking/${populatedTrip._id}`,
          extraData: payloadCommon,
        });
      }

      res.json({
        ok: true,
        message: "Trip cancelled successfully",
        trip,
      });
    } catch (err) {
      console.error("❌ Trip cancel error:", err.message);
      res.status(500).json({
        error: "Server error cancelling trip",
      });
    }
  }
);

/* ==========================================================
   6E — MANAGER UPDATE TRIP
   Update: driver, vehicle, fee, pickup, dropoff
   ========================================================== */
router.patch(
  "/update/:tripId",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const {
        driverId,
        vehicleId,
        deliveryFee,
        pickupLocation,
        dropoffLocation,
      } = req.body;

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      // Fetch trip
      const trip = await Trip.findOne({ _id: tripId, companyId });
      if (!trip)
        return res
          .status(404)
          .json({ error: "Trip not found in your company" });

      // Validate allowed statuses
      if (["delivered", "cancelled"].includes(trip.status)) {
        return res.status(400).json({
          error: `Cannot update trip with status '${trip.status}'.`,
        });
      }

      // DRIVER validation (optional)
      if (driverId && driverId !== String(trip.driverId)) {
        const driver = await User.findOne({
          _id: driverId,
          role: "driver",
          companyId,
        });

        if (!driver)
          return res.status(400).json({
            error: "Driver not found or not part of your company",
          });

        // Check if driver already has an active trip
        const activeTrip = await Trip.findOne({
          driverId,
          status: { $in: ["assigned", "in_progress"] },
          _id: { $ne: tripId },
        });

        if (activeTrip) {
          return res.status(400).json({
            error: "This driver is already busy with another trip.",
          });
        }

        trip.driverId = driverId;
      }

      // VEHICLE validation (optional)
      if (vehicleId && vehicleId !== String(trip.vehicleId)) {
        const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId });

        if (!vehicle)
          return res.status(400).json({
            error: "Vehicle not found or not part of your company",
          });

        if (vehicle.status === "maintenance") {
          return res.status(400).json({
            error: "Vehicle is under maintenance.",
          });
        }

        // Check if vehicle is busy
        const busyVehicle = await Trip.findOne({
          vehicleId,
          status: { $in: ["assigned", "in_progress"] },
          _id: { $ne: tripId },
        });

        if (busyVehicle) {
          return res.status(400).json({
            error: "This vehicle is already in use.",
          });
        }

        trip.vehicleId = vehicleId;
      }

      // Update fee (optional)
      if (typeof deliveryFee === "number" && deliveryFee >= 0) {
        trip.deliveryFee = deliveryFee;
      }

      // Update pickup/dropoff (optional)
      if (pickupLocation) {
        trip.pickupLocation = {
          address: pickupLocation.address || trip.pickupLocation.address,
          lat: pickupLocation.lat ?? trip.pickupLocation.lat,
          lng: pickupLocation.lng ?? trip.pickupLocation.lng,
        };
      }

      if (dropoffLocation) {
        trip.dropoffLocation = {
          address: dropoffLocation.address || trip.dropoffLocation.address,
          lat: dropoffLocation.lat ?? trip.dropoffLocation.lat,
          lng: dropoffLocation.lng ?? trip.dropoffLocation.lng,
        };
      }

      await trip.save();

      // 🔔 Notifications — inform driver + customer of updates
      const populatedTrip = await getPopulatedTripForNotify(trip._id);
      const payloadCommon = {
        trip: populatedTrip,
        driver: populatedTrip.driverId,
        vehicle: populatedTrip.vehicleId,
        customer: populatedTrip.customerId,
      };

      if (populatedTrip.driverId?._id) {
        await createNotification(req, {
          userId: populatedTrip.driverId._id,
          title: "Trip Updated",
          message: "Your assigned trip details have been updated.",
          type: "update",
          category: "driver",
          relatedTripId: populatedTrip._id,
          actionUrl: `/driver/trips/${populatedTrip._id}`,
          extraData: payloadCommon,
        });
      }

      if (populatedTrip.customerId?._id) {
        await createNotification(req, {
          userId: populatedTrip.customerId._id,
          title: "Delivery Updated",
          message: "Your delivery details have been updated.",
          type: "update",
          category: "customer",
          relatedTripId: populatedTrip._id,
          actionUrl: `/customer/tracking/${populatedTrip._id}`,
          extraData: payloadCommon,
        });
      }

      res.json({
        ok: true,
        message: "Trip updated successfully",
        trip,
      });
    } catch (err) {
      console.error("❌ Trip update error:", err.message);
      res.status(500).json({ error: "Server error updating trip" });
    }
  }
);

export default router;
