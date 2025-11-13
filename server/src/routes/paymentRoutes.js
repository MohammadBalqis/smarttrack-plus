import { Router } from "express";
import Payment from "../models/Payment.js";
import Trip from "../models/Trip.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🧾 COLLECT PAYMENT for a delivered trip
   - Driver/Manager/Company can confirm the collection
   - Also marks trip.paymentStatus = 'paid' (if not already)
   ========================================================== */
router.post(
  "/collect",
  protect,
  authorizeRoles("driver", "manager", "company"),
  async (req, res) => {
    try {
      const { tripId, amount, method = "cod", notes, collectedBy } = req.body;
      if (!tripId) return res.status(400).json({ error: "tripId is required" });

      const trip = await Trip.findById(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      // role-based company scope
      const companyId = req.user.role === "company" ? req.user._id : req.user.companyId;

      // basic guard: trip must belong to same company scope
      if (companyId?.toString() !== trip.companyId?.toString()) {
        return res.status(403).json({ error: "Not allowed for this trip" });
      }

      // amount default to deliveryFee
      const finalAmount = typeof amount === "number" ? amount : (trip.deliveryFee || 0);

      const payment = await Payment.create({
        tripId: trip._id,
        companyId,
        driverId: trip.driverId,
        customerId: trip.customerId,
        amount: finalAmount,
        method,
        notes,
        collectedBy: collectedBy || (req.user.role === "driver" ? "driver" : "company"),
        status: "paid",
      });

      // ensure trip is marked paid
      if (trip.paymentStatus !== "paid") {
        trip.paymentStatus = "paid";
        await trip.save();
      }

      res.status(201).json({
        ok: true,
        message: "Payment collected",
        payment,
      });
    } catch (err) {
      console.error("❌ collect payment error:", err.message);
      res.status(500).json({ error: "Server error collecting payment" });
    }
  }
);

/* ==========================================================
   📋 LIST PAYMENTS (company scope)
   - Company/Manager can list all their payments
   ========================================================== */
router.get(
  "/list",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId = req.user.role === "company" ? req.user._id : req.user.companyId;

      const payments = await Payment.find({ companyId })
        .sort({ createdAt: -1 })
        .populate("tripId", "status deliveryFee startTime endTime")
        .populate("driverId", "name email")
        .populate("customerId", "name email");

      res.json({ ok: true, count: payments.length, payments });
    } catch (err) {
      console.error("❌ list payments error:", err.message);
      res.status(500).json({ error: "Server error listing payments" });
    }
  }
);

/* ==========================================================
   📊 COMPANY SUMMARY (totals by method, total revenue)
   ========================================================== */
router.get(
  "/summary/company",
  protect,
  authorizeRoles("company", "manager", "owner"),
  async (req, res) => {
    try {
      let match = {};
      if (req.user.role === "company") match.companyId = req.user._id;
      if (req.user.role === "manager") match.companyId = req.user.companyId;
      // owner: no filter (all companies)

      const all = await Payment.find(match);
      const totalRevenue = all.reduce((s, p) => s + (p.amount || 0), 0);

      const byMethod = all.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + (p.amount || 0);
        return acc;
      }, {});

      const byCollector = all.reduce((acc, p) => {
        acc[p.collectedBy] = (acc[p.collectedBy] || 0) + (p.amount || 0);
        return acc;
      }, {});

      res.json({
        ok: true,
        totalPayments: all.length,
        totalRevenue,
        byMethod,    // { cash: X, card: Y, wallet: Z, cod: W }
        byCollector, // { driver: X, company: Y }
      });
    } catch (err) {
      console.error("❌ company summary error:", err.message);
      res.status(500).json({ error: "Server error in company summary" });
    }
  }
);

/* ==========================================================
   👨‍✈️ DRIVER SUMMARY (self or chosen driver)
   - Driver: their own totals
   - Company/Manager: pass driverId as query to inspect one
   ========================================================== */
router.get(
  "/summary/driver",
  protect,
  authorizeRoles("driver", "manager", "company"),
  async (req, res) => {
    try {
      let driverId = req.user._id;
      let scopeCompanyId = req.user.role === "company" ? req.user._id : req.user.companyId;

      if (req.user.role !== "driver" && req.query.driverId) {
        driverId = req.query.driverId;
      }

      const match = {
        driverId,
        ...(req.user.role === "owner" ? {} : { companyId: scopeCompanyId }),
      };

      const list = await Payment.find(match).sort({ createdAt: -1 });

      const total = list.reduce((s, p) => s + (p.amount || 0), 0);
      const byMethod = list.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + (p.amount || 0);
        return acc;
      }, {});

      res.json({
        ok: true,
        driverId,
        totalPayments: list.length,
        totalCollected: total,
        byMethod,
      });
    } catch (err) {
      console.error("❌ driver summary error:", err.message);
      res.status(500).json({ error: "Server error in driver summary" });
    }
  }
);

export default router;
