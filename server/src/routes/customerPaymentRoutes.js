// server/src/routes/customerPaymentRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import Payment from "../models/Payment.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";

const router = Router();

/* ==========================================================
   🟢 GET ALL PAYMENTS FOR LOGGED-IN CUSTOMER
   ========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const payments = await Payment.find({
        customerId: req.user._id,
      })
        .sort({ createdAt: -1 })
        .populate("tripId", "pickupLocation dropoffLocation status deliveryFee")
        .populate("companyId", "name email phone");

      res.json({
        ok: true,
        count: payments.length,
        payments,
      });
    } catch (err) {
      console.error("❌ Error loading customer payments:", err.message);
      res.status(500).json({ error: "Error fetching payments" });
    }
  }
);

/* ==========================================================
   🔍 GET SINGLE PAYMENT DETAILS
   ========================================================== */
router.get(
  "/:paymentId",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findOne({
        _id: paymentId,
        customerId: req.user._id, // ensure customer owns this payment
      })
        .populate("tripId", "pickupLocation dropoffLocation deliveryFee totalAmount status driverId vehicleId")
        .populate("companyId", "name email phone address");

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Optional: load driver and vehicle details
      let driver = null;
      let vehicle = null;

      if (payment.tripId?.driverId) {
        driver = await User.findById(payment.tripId.driverId)
          .select("name email phone profileImage");
      }

      if (payment.tripId?.vehicleId) {
        vehicle = await Vehicle.findById(payment.tripId.vehicleId)
          .select("type brand model plateNumber vehicleImage");
      }

      res.json({
        ok: true,
        payment,
        driver,
        vehicle,
      });
    } catch (err) {
      console.error("❌ Error loading payment details:", err.message);
      res.status(500).json({ error: "Error fetching payment details" });
    }
  }
);

export default router;
