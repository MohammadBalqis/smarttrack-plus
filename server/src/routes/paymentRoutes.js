// server/src/routes/paymentRoutes.js
import { Router } from "express";
import Payment from "../models/Payment.js";
import Trip from "../models/Trip.js";
import GlobalSettings from "../models/GlobalSettings.js"; // ✅ global settings
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🧾 1. COLLECT PAYMENT
   - Driver / Manager / Company / Owner / Superadmin
   - Auto marks trip as paid
   - Respects maintenanceMode (superadmin bypass)
   ========================================================== */
router.post(
  "/collect",
  protect,
  authorizeRoles("driver", "manager", "company", "owner", "superadmin"),
  async (req, res) => {
    try {
      const settings = await GlobalSettings.findOne();

      // ❌ System maintenance check
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({
          ok: false,
          error: "System is under maintenance.",
        });
      }

      const {
        tripId,
        amount,
        method = "cod",
        notes,
        collectedBy,
        companyId: bodyCompanyId, // used for owner/superadmin
      } = req.body;

      if (!tripId) return res.status(400).json({ error: "tripId is required" });

      const trip = await Trip.findById(tripId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      let companyId;

      if (req.user.role === "company") {
        companyId = req.user._id;
      } else if (req.user.role === "manager" || req.user.role === "driver") {
        companyId = req.user.companyId;
      } else if (req.user.role === "owner" || req.user.role === "superadmin") {
        companyId = bodyCompanyId || trip.companyId;
      }

      if (!companyId) {
        return res.status(400).json({
          error:
            "companyId is required when collecting payment as owner/superadmin.",
        });
      }

      // basic guard: trip must belong to same company scope
      if (companyId?.toString() !== trip.companyId?.toString()) {
        return res.status(403).json({ error: "Not allowed for this trip" });
      }

      // amount default to deliveryFee
      const finalAmount =
        typeof amount === "number" ? amount : trip.deliveryFee || 0;

      const payment = await Payment.create({
        tripId: trip._id,
        companyId,
        driverId: trip.driverId,
        customerId: trip.customerId,
        amount: finalAmount,
        method,
        notes,
        collectedBy:
          collectedBy ||
          (req.user.role === "driver" ? "driver" : "company"),
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
   📋 2. LIST PAYMENTS (Company / Manager / Owner / Superadmin)
   ========================================================== */
router.get(
  "/list",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const settings = await GlobalSettings.findOne();
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({
          ok: false,
          error: "System is under maintenance.",
        });
      }

      const { companyId: queryCompanyId } = req.query;

      const match = {};

      if (req.user.role === "company") {
        match.companyId = req.user._id;
      } else if (req.user.role === "manager") {
        match.companyId = req.user.companyId;
      } else if (req.user.role === "owner" || req.user.role === "superadmin") {
        // optional ?companyId filter
        if (queryCompanyId) {
          match.companyId = queryCompanyId;
        }
      }

      const payments = await Payment.find(match)
        .sort({ createdAt: -1 })
        .populate("tripId", "status deliveryFee startTime endTime")
        .populate("driverId", "name email")
        .populate("customerId", "name email");

      res.json({
        ok: true,
        count: payments.length,
        payments,
      });
    } catch (err) {
      console.error("❌ list payments error:", err.message);
      res.status(500).json({ error: "Server error listing payments" });
    }
  }
);

/* ==========================================================
   📊 3. COMPANY SUMMARY
   - Company/Manager: own company only
   - Owner/Superadmin: all companies, or filter by ?companyId
   ========================================================== */
router.get(
  "/summary/company",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const settings = await GlobalSettings.findOne();
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({
          ok: false,
          error: "System is under maintenance.",
        });
      }

      const { companyId: queryCompanyId } = req.query;

      let match = {};

      if (req.user.role === "company") {
        match.companyId = req.user._id;
      } else if (req.user.role === "manager") {
        match.companyId = req.user.companyId;
      } else if (req.user.role === "owner" || req.user.role === "superadmin") {
        if (queryCompanyId) {
          match.companyId = queryCompanyId;
        }
      }

      const all = await Payment.find(match);
      const totalRevenue = all.reduce((sum, p) => sum + (p.amount || 0), 0);

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
        byMethod, // { cash: X, card: Y, wallet: Z, cod: W }
        byCollector, // { driver: X, company: Y }
      });
    } catch (err) {
      console.error("❌ company summary error:", err.message);
      res.status(500).json({ error: "Server error in summary" });
    }
  }
);

/* ==========================================================
   👨‍✈️ 4. DRIVER SUMMARY (self or specific driver)
   - Driver: own totals
   - Company/Manager: only their company
   - Owner/Superadmin: any driver (optionally filter by company)
   ========================================================== */
router.get(
  "/summary/driver",
  protect,
  authorizeRoles(
    "driver",
    "manager",
    "company",
    "owner",
    "superadmin"
  ),
  async (req, res) => {
    try {
      const settings = await GlobalSettings.findOne();
      if (settings?.maintenanceMode && req.user.role !== "superadmin") {
        return res.status(503).json({
          ok: false,
          error: "System is under maintenance.",
        });
      }

      const { driverId: queryDriverId, companyId: queryCompanyId } = req.query;

      let driverId = req.user._id;
      let match = {};

      if (req.user.role === "driver") {
        driverId = req.user._id;
        match.driverId = driverId;
        match.companyId = req.user.companyId;
      } else if (req.user.role === "company") {
        driverId = queryDriverId || driverId;
        match.driverId = driverId;
        match.companyId = req.user._id;
      } else if (req.user.role === "manager") {
        driverId = queryDriverId || driverId;
        match.driverId = driverId;
        match.companyId = req.user.companyId;
      } else if (req.user.role === "owner" || req.user.role === "superadmin") {
        driverId = queryDriverId || driverId;
        match.driverId = driverId;
        if (queryCompanyId) {
          match.companyId = queryCompanyId;
        }
      }

      const list = await Payment.find(match).sort({ createdAt: -1 });

      const totalCollected = list.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      const byMethod = list.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + (p.amount || 0);
        return acc;
      }, {});

      res.json({
        ok: true,
        driverId,
        totalPayments: list.length,
        totalCollected,
        byMethod,
      });
    } catch (err) {
      console.error("❌ driver summary error:", err.message);
      res.status(500).json({ error: "Server error in driver summary" });
    }
  }
);

export default router;
