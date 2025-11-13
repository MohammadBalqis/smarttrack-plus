import { Router } from "express";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import Payment from "../models/Payment.js"; // ✅ for auto-payment
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const router = Router();

/* ==========================================================
   🟢 1. Create a Trip (Company / Manager)
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

      // Determine assigned company
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

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
      await Vehicle.findByIdAndUpdate(vehicleId, { status: "in_use" });

      res.status(201).json({
        ok: true,
        message: "Trip created & vehicle marked as in_use",
        trip,
      });
    } catch (err) {
      console.error("❌ Trip creation error:", err.message);
      res.status(500).json({ error: "Server error creating trip" });
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
        return res.status(400).json({ error: "Missing tripId, lat or lng" });

      const trip = await Trip.findById(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      // Add new route point
      trip.routeHistory.push({ lat, lng, timestamp: new Date() });
      trip.status = "in_progress";
      await trip.save();

      res.json({
        ok: true,
        message: "Location updated",
        routeCount: trip.routeHistory.length,
      });
    } catch (err) {
      console.error("❌ Location update error:", err.message);
      res.status(500).json({ error: "Server error updating location" });
    }
  }
);

/* ==========================================================
   ✅ 3. Complete Trip (Auto Payment + Vehicle Available)
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

      // Update trip fields
      trip.status = "delivered";
      trip.endTime = new Date();
      trip.totalDistance = totalDistance || trip.totalDistance;
      trip.paymentStatus = "paid";
      await trip.save();

      // Free the vehicle
      await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: "available" });

      // AUTO-CREATE PAYMENT ENTRY  
      const existingPayment = await Payment.findOne({ tripId });
      if (!existingPayment) {
        await Payment.create({
          tripId: trip._id,
          companyId: trip.companyId,
          driverId: trip.driverId,
          customerId: trip.customerId,
          amount: trip.deliveryFee || 0,
          method: "cod",
          status: "paid",
          collectedBy: "driver",
          notes: "Auto-created on trip completion",
        });
      }

      res.json({
        ok: true,
        message:
          "Trip completed, vehicle available, and payment recorded automatically",
        trip,
      });
    } catch (err) {
      console.error("❌ Trip complete error:", err.message);
      res.status(500).json({ error: "Server error completing trip" });
    }
  }
);

/* ==========================================================
   📋 4. Get Active Trips for Driver
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
      }).populate("vehicleId customerId companyId");

      res.json({ ok: true, count: trips.length, trips });
    } catch (err) {
      console.error("❌ Fetch active trips error:", err.message);
      res.status(500).json({ error: "Error fetching active trips" });
    }
  }
);

/* ==========================================================
   🌍 5. Get Full Route History of a Trip
   ========================================================== */
router.get(
  "/:tripId/route",
  protect,
  authorizeRoles("company", "manager", "owner"),
  async (req, res) => {
    try {
      const trip = await Trip.findById(req.params.tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      res.json({
        ok: true,
        route: trip.routeHistory,
        totalPoints: trip.routeHistory.length,
      });
    } catch (err) {
      console.error("❌ Route history error:", err.message);
      res.status(500).json({ error: "Error retrieving trip route" });
    }
  }
);
/* ==========================================================
   📦 6. List All Trips (Company / Manager / Owner)
   ========================================================== */
router.get(
  "/list",
  protect,
  authorizeRoles("company", "manager", "owner"),
  async (req, res) => {
    try {
      // Determine the company ID of requester
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const trips = await Trip.find({ companyId })
        .populate("driverId", "name email profileImage role")
        .populate("vehicleId", "type brand model plateNumber status")
        .populate("customerId", "name email phone")
        .sort({ createdAt: -1 });

      res.json({
        ok: true,
        total: trips.length,
        trips,
      });
    } catch (err) {
      console.error("❌ Error fetching trip list:", err.message);
      res.status(500).json({ error: "Error fetching trip list" });
    }
  }
);
/* ==========================================================
   🟢 Generate Secure QR for Delivery Confirmation
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

      // 🔐 Create short-lived secure token (10 minutes)
      const qrToken = jwt.sign(
        {
          tripId: trip._id,
          driverId: trip.driverId,
          customerId: trip.customerId,
        },
        process.env.QR_SECRET,
        { expiresIn: "10m" }
      );

      // 🔗 Confirmation URL (customer or driver will open it)
      const confirmUrl = `${process.env.FRONTEND_URL}/confirm-delivery?token=${qrToken}`;

      // 🟢 Generate QR Image (Base64)
      const qrImage = await QRCode.toDataURL(confirmUrl);

      res.json({
        ok: true,
        confirmUrl,
        qrImage,
        expiresIn: "10 minutes",
      });
    } catch (err) {
      console.error("❌ Error generating QR:", err.message);
      res.status(500).json({ error: "Server error generating QR" });
    }
  }
);
/* ==========================================================
   🟣 Confirm Delivery (Customer scans QR)
   ========================================================== */
router.post("/confirm-delivery", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) return res.status(400).json({ error: "Missing QR token" });

    // 🔐 Verify QR token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.QR_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired QR token" });
    }

    const { tripId } = decoded;
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    // Trip must be delivered by driver first
    if (trip.status !== "delivered") {
      return res.status(400).json({ error: "Driver has not marked this trip as delivered yet." });
    }

    // 🟢 Customer confirmation
    trip.customerConfirmed = true;
    trip.confirmationTime = new Date();
    await trip.save();

    // 🟦 Free the vehicle if not freed yet
    await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: "available" });

    res.json({
      ok: true,
      message: "Delivery confirmed successfully by the customer!",
      trip,
    });
  } catch (err) {
    console.error("❌ Error confirming delivery:", err.message);
    res.status(500).json({ error: "Server error confirming delivery" });
  }
});
/* ==========================================================
   🛰️ 6. Customer Live Tracking — Trip Full Details
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
        customerId: req.user._id, // ensure trip belongs to this customer
      })
        .populate("driverId", "name email profileImage phone")
        .populate("vehicleId", "type brand model plateNumber status")
        .populate("companyId", "name email companyName");

      if (!trip) return res.status(404).json({ error: "Trip not found" });

      res.json({
        ok: true,
        tripId: trip._id,
        status: trip.status,
        pickupLocation: trip.pickupLocation,
        dropoffLocation: trip.dropoffLocation,

        // 🧭 live route points
        routeHistory: trip.routeHistory, // [{lat, lng, timestamp}, ...]

        // 👨‍🔧 driver data
        driver: trip.driverId
          ? {
              name: trip.driverId.name,
              email: trip.driverId.email,
              profileImage: trip.driverId.profileImage,
              phone: trip.driverId.phone || null,
            }
          : null,

        // 🚗 vehicle data
        vehicle: trip.vehicleId
          ? {
              type: trip.vehicleId.type,
              brand: trip.vehicleId.brand,
              model: trip.vehicleId.model,
              plateNumber: trip.vehicleId.plateNumber,
              status: trip.vehicleId.status,
            }
          : null,

        // 🔢 counts & ETA support
        totalRoutePoints: trip.routeHistory.length,
        startTime: trip.startTime,
        endTime: trip.endTime || null,
      });
    } catch (err) {
      console.error("❌ Live tracking error:", err.message);
      res.status(500).json({ error: "Server error retrieving live tracking" });
    }
  }
);

export default router;
