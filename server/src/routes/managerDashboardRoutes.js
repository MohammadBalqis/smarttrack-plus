// server/src/routes/managerDashboardRoutes.js
import { Router } from "express";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import Payment from "../models/Payment.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   📊 1) MANAGER DASHBOARD — SUMMARY + ALERTS
   ========================================================== */
router.get(
  "/summary",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );

      /* ---------------------------
         1) COUNTS
      ----------------------------*/
      const [totalDrivers, activeDrivers, totalVehicles, availableVehicles] =
        await Promise.all([
          User.countDocuments({ companyId, role: "driver" }),
          User.countDocuments({ companyId, role: "driver", isActive: true }),
          Vehicle.countDocuments({ companyId }),
          Vehicle.countDocuments({ companyId, status: "available" }),
        ]);

      /* ---------------------------
         2) ORDER COUNTS
      ----------------------------*/
      const [
        todayOrders,
        pendingOrders,
        assignedOrders,
        inProgressOrders,
        deliveredToday,
      ] = await Promise.all([
        Trip.countDocuments({ companyId, createdAt: { $gte: todayStart } }),
        Trip.countDocuments({ companyId, status: "pending" }),
        Trip.countDocuments({ companyId, status: "assigned" }),
        Trip.countDocuments({ companyId, status: "in_progress" }),
        Trip.countDocuments({
          companyId,
          status: "delivered",
          updatedAt: { $gte: todayStart },
        }),
      ]);

      /* ---------------------------
         3) TODAY REVENUE
      ----------------------------*/
      const todayRevenueAgg = await Payment.aggregate([
        {
          $match: {
            companyId,
            createdAt: { $gte: todayStart },
            status: "paid",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const revenueToday = todayRevenueAgg[0]?.total || 0;

      /* ---------------------------
         4) ADVANCED ALERTS
      ----------------------------*/
      const alerts = {
        drivers: [],
        vehicles: [],
        orders: [],
      };

      // Active trips for checks (max 50 to keep it light)
      const activeTrips = await Trip.find({
        companyId,
        status: { $in: ["assigned", "in_progress"] },
      })
        .sort({ updatedAt: -1 })
        .limit(50);

      /* ---- DRIVER ALERTS ---- */

      // Driver inactivity (no GPS for 10+ minutes)
      for (const trip of activeTrips) {
        const lastPoint = trip.routeHistory[trip.routeHistory.length - 1];

        if (lastPoint) {
          const diffMs =
            Date.now() - new Date(lastPoint.timestamp).getTime();
          if (diffMs > 10 * 60 * 1000) {
            alerts.drivers.push({
              type: "driver_inactive",
              severity: "high",
              message: `Driver ${trip.driverId} inactive for 10+ minutes`,
              relatedId: trip.driverId,
              tripId: trip._id,
              createdAt: new Date(),
            });
          }
        }
      }

      // Vehicle-driver mismatch (vehicle "available" but has driverId)
      const conflictVehicles = await Vehicle.find({
        companyId,
        status: "available",
        driverId: { $ne: null },
      });

      conflictVehicles.forEach((v) =>
        alerts.drivers.push({
          type: "vehicle_driver_conflict",
          severity: "medium",
          message: `Vehicle ${v.plateNumber} is marked available but still has a driver assigned`,
          relatedId: v._id,
          createdAt: new Date(),
        })
      );

      /* ---- VEHICLE ALERTS ---- */

      // Vehicles in maintenance
      const maintenanceVehicles = await Vehicle.find({
        companyId,
        status: "maintenance",
      });

      maintenanceVehicles.forEach((v) =>
        alerts.vehicles.push({
          type: "maintenance",
          severity: "low",
          message: `Vehicle ${v.plateNumber} is under maintenance`,
          relatedId: v._id,
          createdAt: new Date(),
        })
      );

      // Over-used vehicles = 5+ trips today
      const overUsedAgg = await Trip.aggregate([
        {
          $match: {
            companyId,
            status: "delivered",
            createdAt: { $gte: todayStart },
          },
        },
        {
          $group: {
            _id: "$vehicleId",
            tripsToday: { $sum: 1 },
          },
        },
        { $match: { tripsToday: { $gte: 5 } } },
      ]);

      overUsedAgg.forEach((v) =>
        alerts.vehicles.push({
          type: "over_used",
          severity: "medium",
          message: `Vehicle ${v._id} completed ${v.tripsToday} trips today`,
          relatedId: v._id,
          createdAt: new Date(),
        })
      );

      /* ---- ORDER ALERTS ---- */

      // Pending for more than 15 minutes
      const pendingTooLong = await Trip.find({
        companyId,
        status: "pending",
        createdAt: {
          $lte: new Date(Date.now() - 15 * 60 * 1000),
        },
      });

      pendingTooLong.forEach((t) =>
        alerts.orders.push({
          type: "pending_too_long",
          severity: "medium",
          message: `Order ${t._id} pending for more than 15 minutes`,
          relatedId: t._id,
          createdAt: new Date(),
        })
      );

      // in_progress but no GPS for 10+ minutes (re-using activeTrips)
      for (const trip of activeTrips) {
        const lastPoint = trip.routeHistory[trip.routeHistory.length - 1];
        if (lastPoint) {
          const diffMs =
            Date.now() - new Date(lastPoint.timestamp).getTime();
          if (diffMs > 10 * 60 * 1000) {
            alerts.orders.push({
              type: "stuck_order",
              severity: "high",
              message: `Order ${trip._id} seems stuck (no movement for 10 minutes)`,
              relatedId: trip._id,
              createdAt: new Date(),
            });
          }
        }
      }

      // Delivered but not confirmed after 30 min
      const unconfirmed = await Trip.find({
        companyId,
        status: "delivered",
        customerConfirmed: false,
        endTime: {
          $lte: new Date(Date.now() - 30 * 60 * 1000),
        },
      });

      unconfirmed.forEach((t) =>
        alerts.orders.push({
          type: "unconfirmed_delivery",
          severity: "low",
          message: `Order ${t._id} delivered but not confirmed by customer`,
          relatedId: t._id,
          createdAt: new Date(),
        })
      );

      /* ---- RESPONSE ---- */
      res.json({
        ok: true,
        summary: {
          counts: {
            drivers: {
              total: totalDrivers,
              active: activeDrivers,
            },
            vehicles: {
              total: totalVehicles,
              available: availableVehicles,
            },
            orders: {
              today: todayOrders,
              pending: pendingOrders,
              assigned: assignedOrders,
              in_progress: inProgressOrders,
              deliveredToday,
            },
            revenueToday,
          },
          alerts,
        },
      });
    } catch (err) {
      console.error("❌ Manager Summary Error:", err.message);
      res
        .status(500)
        .json({ error: "Server error loading manager dashboard summary" });
    }
  }
);

/* ==========================================================
   📦 2) MANAGER DASHBOARD — FULL DATA (TRIPS, PERFORMANCE)
   ========================================================== */
router.get(
  "/data",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const now = new Date();
      const weekAgo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7
      );
      const dayAgo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
      );

      /* ------------------------------------------------------
         1) TRIPS LISTS
      ------------------------------------------------------ */
      const [activeTrips, pendingTrips, recentCompleted] = await Promise.all([
        Trip.find({
          companyId,
          status: { $in: ["assigned", "in_progress"] },
        })
          .sort({ createdAt: -1 })
          .populate("driverId", "name email profileImage")
          .populate("vehicleId", "type brand model plateNumber status")
          .populate("customerId", "name email"),

        Trip.find({
          companyId,
          status: "pending",
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate("customerId", "name email"),

        Trip.find({
          companyId,
          status: "delivered",
        })
          .sort({ updatedAt: -1 })
          .limit(20)
          .populate("driverId", "name email profileImage")
          .populate("vehicleId", "type brand model plateNumber")
          .populate("customerId", "name email"),
      ]);

      /* ------------------------------------------------------
         2) DRIVER PERFORMANCE (last 7 days)
      ------------------------------------------------------ */
      const driverAgg = await Trip.aggregate([
        {
          $match: {
            companyId,
            status: "delivered",
            createdAt: { $gte: weekAgo },
          },
        },
        {
          $group: {
            _id: "$driverId",
            totalTrips: { $sum: 1 },
            totalRevenue: { $sum: "$deliveryFee" },
            lastTripAt: { $max: "$updatedAt" },
          },
        },
        { $sort: { totalTrips: -1 } },
        { $limit: 20 },
      ]);

      const driverIds = driverAgg.map((d) => d._id).filter(Boolean);
      const driversMap = driverIds.length
        ? await User.find({ _id: { $in: driverIds } }).then((list) => {
            const map = {};
            list.forEach((u) => {
              map[u._id.toString()] = u;
            });
            return map;
          })
        : {};

      const driverPerformance = driverAgg.map((d) => {
        const info = driversMap[d._id?.toString()] || {};
        return {
          driverId: d._id,
          name: info.name || "Unknown driver",
          email: info.email || null,
          profileImage: info.profileImage || null,
          totalTrips: d.totalTrips,
          totalRevenue: d.totalRevenue,
          lastTripAt: d.lastTripAt,
        };
      });

      /* ------------------------------------------------------
         3) VEHICLE PERFORMANCE (last 7 days)
      ------------------------------------------------------ */
      const vehicleAgg = await Trip.aggregate([
        {
          $match: {
            companyId,
            status: "delivered",
            createdAt: { $gte: weekAgo },
          },
        },
        {
          $group: {
            _id: "$vehicleId",
            tripsCount: { $sum: 1 },
            totalRevenue: { $sum: "$deliveryFee" },
            lastTripAt: { $max: "$updatedAt" },
          },
        },
        { $sort: { tripsCount: -1 } },
        { $limit: 20 },
      ]);

      const vehicleIds = vehicleAgg.map((v) => v._id).filter(Boolean);
      const vehiclesMap = vehicleIds.length
        ? await Vehicle.find({ _id: { $in: vehicleIds } }).then((list) => {
            const map = {};
            list.forEach((v) => {
              map[v._id.toString()] = v;
            });
            return map;
          })
        : {};

      const vehiclePerformance = vehicleAgg.map((v) => {
        const info = vehiclesMap[v._id?.toString()] || {};
        return {
          vehicleId: v._id,
          plateNumber: info.plateNumber || "Unknown",
          type: info.type || null,
          brand: info.brand || null,
          model: info.model || null,
          tripsCount: v.tripsCount,
          totalRevenue: v.totalRevenue,
          lastTripAt: v.lastTripAt,
        };
      });

      /* ------------------------------------------------------
         4) REVENUE TIMESERIES (last 7 days)
      ------------------------------------------------------ */
      const revenueAgg = await Payment.aggregate([
        {
          $match: {
            companyId,
            status: "paid",
            createdAt: { $gte: weekAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const revenueByDay = revenueAgg.map((r) => ({
        date: r._id,
        total: r.total,
      }));

      /* ------------------------------------------------------
         5) HEATMAP POINTS (last 24h)
      ------------------------------------------------------ */
      const tripsForHeatmap = await Trip.find({
        companyId,
        createdAt: { $gte: dayAgo },
        routeHistory: { $exists: true, $ne: [] },
      }).select("routeHistory");

      const heatmapPoints = [];
      for (const t of tripsForHeatmap) {
        for (const p of t.routeHistory) {
          if (p.lat != null && p.lng != null) {
            heatmapPoints.push({
              lat: p.lat,
              lng: p.lng,
              timestamp: p.timestamp,
            });
          }
        }
      }

      /* ------------------------------------------------------
         6) RESPONSE
      ------------------------------------------------------ */
      res.json({
        ok: true,
        activeTrips,
        pendingTrips,
        recentCompleted,
        driverPerformance,
        vehiclePerformance,
        revenueByDay,
        heatmapPoints,
      });
    } catch (err) {
      console.error("❌ Manager Data Error:", err.message);
      res.status(500).json({ error: "Server error loading manager dashboard data" });
    }
  }
);

export default router;
