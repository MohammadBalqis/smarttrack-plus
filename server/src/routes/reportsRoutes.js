// server/src/routes/reportsRoutes.js
import { Router } from "express";
import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import GlobalSettings from "../models/GlobalSettings.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🔒 ROLE LIMITS:
   - company: own company only
   - manager: own company only
   - owner/superadmin: all companies or filter by ?companyId
   ========================================================== */
const resolveCompanyScope = (req, queryCompanyId = null) => {
  if (req.user.role === "company") return req.user._id;
  if (req.user.role === "manager") return req.user.companyId;
  if (req.user.role === "owner" || req.user.role === "superadmin")
    return queryCompanyId || null;
  return null;
};

/* ==========================================================
   📊 1. REVENUE OVERVIEW
   ========================================================== */
router.get(
  "/revenue/overview",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const companyId = resolveCompanyScope(req, req.query.companyId);

      const match = companyId ? { companyId } : {};

      const payments = await Payment.find(match);

      const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const byMethod = {};
      const byCollector = {};

      for (const p of payments) {
        byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
        byCollector[p.collectedBy] =
          (byCollector[p.collectedBy] || 0) + p.amount;
      }

      res.json({
        ok: true,
        totalRevenue,
        totalPayments: payments.length,
        byMethod,
        byCollector,
      });
    } catch (err) {
      console.error("❌ Revenue overview error:", err.message);
      res.status(500).json({ error: "Error calculating revenue" });
    }
  }
);

/* ==========================================================
   📅 2. REVENUE BY DATE RANGE
   ========================================================== */
router.get(
  "/revenue/range",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate)
        return res.status(400).json({ error: "startDate & endDate required" });

      const companyId = resolveCompanyScope(req, req.query.companyId);

      const match = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
      if (companyId) match.companyId = companyId;

      const payments = await Payment.find(match).sort({ createdAt: 1 });

      const daily = {};
      for (const p of payments) {
        const d = p.createdAt.toISOString().split("T")[0];
        daily[d] = (daily[d] || 0) + p.amount;
      }

      res.json({
        ok: true,
        startDate,
        endDate,
        dailyRevenue: daily,
        total: payments.length,
      });
    } catch (err) {
      console.error("❌ Range revenue error:", err.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ==========================================================
   🚚 3. TRIPS OVERVIEW
   ========================================================== */
router.get(
  "/trips/overview",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const companyId = resolveCompanyScope(req, req.query.companyId);

      const match = companyId ? { companyId } : {};

      const trips = await Trip.find(match);

      const total = trips.length;
      const delivered = trips.filter((t) => t.status === "delivered").length;
      const cancelled = trips.filter((t) => t.status === "cancelled").length;
      const inProgress = trips.filter((t) =>
        ["assigned", "in_progress"].includes(t.status)
      ).length;

      const avgTime =
        trips
          .filter((t) => t.startTime && t.endTime)
          .reduce((sum, t) => {
            const diff =
              new Date(t.endTime).getTime() -
              new Date(t.startTime).getTime();
            return sum + diff;
          }, 0) /
        (delivered || 1);

      res.json({
        ok: true,
        total,
        delivered,
        cancelled,
        inProgress,
        avgDeliveryTimeMinutes: Math.round(avgTime / 1000 / 60),
      });
    } catch (err) {
      console.error("❌ Trips overview error:", err.message);
      res.status(500).json({ error: "Error loading trips overview" });
    }
  }
);

/* ==========================================================
   🧑‍✈️ 4. TRIPS PER DRIVER
   ========================================================== */
router.get(
  "/drivers/performance",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const companyId = resolveCompanyScope(req, req.query.companyId);

      const driverMatch = { role: "driver" };
      if (companyId) driverMatch.companyId = companyId;

      const drivers = await User.find(driverMatch);

      const perf = [];

      for (const d of drivers) {
        const trips = await Trip.find({ driverId: d._id });

        const delivered = trips.filter((t) => t.status === "delivered");
        const cancelled = trips.filter((t) => t.status === "cancelled");

        const payments = await Payment.find({ driverId: d._id });

        perf.push({
          driverId: d._id,
          name: d.name,
          profileImage: d.profileImage,
          totalTrips: trips.length,
          delivered: delivered.length,
          cancelled: cancelled.length,
          earning: payments.reduce((s, p) => s + p.amount, 0),
          rating: d.driverRating,
          distance: trips.reduce((s, t) => s + (t.totalDistance || 0), 0),
        });
      }

      res.json({ ok: true, drivers: perf });
    } catch (err) {
      console.error("❌ Driver performance error:", err.message);
      res.status(500).json({ error: "Error loading driver performance" });
    }
  }
);

/* ==========================================================
   🌍 5. HEATMAP — MOST COMMON PICKUP/DROPOFF
   ========================================================== */
router.get(
  "/heatmap",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const companyId = resolveCompanyScope(req, req.query.companyId);

      const match = companyId ? { companyId } : {};

      const trips = await Trip.find(match);

      const pickup = {};
      const dropoff = {};

      for (const t of trips) {
        if (t.pickupLocation?.address) {
          pickup[t.pickupLocation.address] =
            (pickup[t.pickupLocation.address] || 0) + 1;
        }
        if (t.dropoffLocation?.address) {
          dropoff[t.dropoffLocation.address] =
            (dropoff[t.dropoffLocation.address] || 0) + 1;
        }
      }

      res.json({
        ok: true,
        pickupHotspots: pickup,
        dropoffHotspots: dropoff,
      });
    } catch (err) {
      console.error("❌ Heatmap error:", err.message);
      res.status(500).json({ error: "Error generating heatmap" });
    }
  }
);

/* ==========================================================
   ⏰ 6. PEAK HOURS (HOUR + WEEKDAY)
   ========================================================== */
router.get(
  "/peak-hours",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      const companyId = resolveCompanyScope(req, req.query.companyId);
      const match = companyId ? { companyId } : {};

      const trips = await Trip.find(match);

      const byHour = {};
      const byDay = {};

      for (const t of trips) {
        const date = new Date(t.createdAt);
        const hour = date.getHours();
        const day = date.getDay();

        byHour[hour] = (byHour[hour] || 0) + 1;
        byDay[day] = (byDay[day] || 0) + 1;
      }

      res.json({
        ok: true,
        byHour,
        byDay,
      });
    } catch (err) {
      console.error("❌ Peak hours error:", err.message);
      res.status(500).json({ error: "Error loading peak hours" });
    }
  }
);

export default router;
