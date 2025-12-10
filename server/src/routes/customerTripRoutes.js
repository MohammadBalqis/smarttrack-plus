// server/src/routes/customerTripRoutes.js
import { Router } from "express";
import Trip from "../models/Trip.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getCustomerTripQrInfo } from "../controllers/trip/tripQrController.js";

const router = Router();

/* ==========================================================
   🟢 1. Customer CREATES a delivery order (GLOBAL CUSTOMER)
   ========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const {
        companyId,        // 🔥 customer chooses company from frontend
        pickupAddress,
        pickupLat,
        pickupLng,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        customerPhone,
        customerNotes,
        deliveryFee,
      } = req.body;

      if (!companyId)
        return res.status(400).json({ error: "companyId is required" });

      if (!pickupAddress || !dropoffAddress) {
        return res.status(400).json({
          error: "pickupAddress and dropoffAddress are required",
        });
      }

      const pickupLocation = {
        address: pickupAddress,
        lat: pickupLat || null,
        lng: pickupLng || null,
      };

      const dropoffLocation = {
        address: dropoffAddress,
        lat: dropoffLat || null,
        lng: dropoffLng || null,
      };

      const trip = await Trip.create({
        companyId,         // 🔥 customer selects company per order
        customerId: req.user._id,
        driverId: null,
        vehicleId: null,

        pickupLocation,
        dropoffLocation,

        deliveryFee: typeof deliveryFee === "number" ? deliveryFee : 0,

        status: "pending",
        paymentStatus: "unpaid",

        createdByCustomer: true,
        customerAddress: dropoffAddress,
        customerPhone: customerPhone || null,
        customerNotes: customerNotes || null,
      });

      res.status(201).json({
        ok: true,
        message: "Delivery request submitted!",
        trip,
      });
    } catch (err) {
      console.error("❌ Error creating customer trip:", err.message);
      res.status(500).json({ error: "Server error creating customer trip" });
    }
  }
);

/* ==========================================================
   🟡 2. ACTIVE orders (pending/assigned/in_progress)
   ========================================================== */
router.get(
  "/active",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const trips = await Trip.find({
        customerId: req.user._id,
        status: { $in: ["pending", "assigned", "in_progress"] },
      })
        .sort({ createdAt: -1 })
        .populate("driverId", "name email profileImage phone")
        .populate("vehicleId", "type brand model plateNumber status vehicleImage")
        .populate("companyId", "name email companyName");

      res.json({
        ok: true,
        count: trips.length,
        trips,
      });
    } catch (err) {
      console.error("❌ Error fetching active customer trips:", err.message);
      res.status(500).json({ error: "Error fetching active orders" });
    }
  }
);

/* ==========================================================
   📜 3. ORDER HISTORY (delivered / cancelled)
   ========================================================== */
router.get(
  "/history",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const trips = await Trip.find({
        customerId: req.user._id,
        status: { $in: ["delivered", "cancelled"] },
      })
        .sort({ createdAt: -1 })
        .populate("driverId", "name email profileImage phone")
        .populate("companyId", "name email companyName");

      res.json({
        ok: true,
        count: trips.length,
        trips,
      });
    } catch (err) {
      console.error("❌ Error fetching customer history:", err.message);
      res.status(500).json({ error: "Error fetching order history" });
    }
  }
);

/* ==========================================================
   🔍 4. SINGLE TRIP DETAILS (for tracking screen)
   ========================================================== */
router.get(
  "/details/:tripId",
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
        .populate("vehicleId", "type brand model plateNumber vehicleImage")
        .populate("companyId", "name email companyName");

      if (!trip) {
        return res.status(404).json({ error: "Trip not found or unauthorized" });
      }

      res.json({ ok: true, trip });
    } catch (err) {
      console.error("❌ Error fetching trip details:", err.message);
      res.status(500).json({ error: "Error fetching trip details" });
    }
  }
);
/* ==========================================================
   ✅ 5. CUSTOMER CONFIRMS DELIVERY (mark as received)
   ========================================================== */
router.post(
  "/:tripId/confirm-received",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const { tripId } = req.params;

      const trip = await Trip.findOne({
        _id: tripId,
        customerId: req.user._id,
      });

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      if (trip.status !== "delivered") {
        return res.status(400).json({
          error: "Trip is not delivered yet.",
        });
      }

      if (trip.customerConfirmed) {
        return res.json({
          ok: true,
          message: "Already confirmed.",
          trip,
        });
      }

      trip.customerConfirmed = true;
      trip.confirmationTime = new Date();
      await trip.save();

      // (optional later) emit socket event to company/manager

      res.json({
        ok: true,
        message: "Delivery confirmed. Thank you!",
        trip,
      });
    } catch (err) {
      console.error("❌ confirm-received error:", err.message);
      res.status(500).json({ error: "Server error confirming delivery" });
    }
  }
);
// Customer gets QR + driver info for a specific trip
// GET /api/customer/trips/:tripId/qr
router.get("/:tripId/qr", protect, authorizeRoles("customer"), getCustomerTripQrInfo);

export default router;
