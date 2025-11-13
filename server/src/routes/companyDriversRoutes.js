import { Router } from "express";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🟢 GET ALL DRIVERS FOR COMPANY
   ========================================================== */
router.get(
  "/all",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      // 1) Get all drivers of this company
      const drivers = await User.find({
        companyId,
        role: "driver",
      }).select("name email profileImage isActive createdAt");

      // 2) For each driver → load stats
      const driverStats = await Promise.all(
        drivers.map(async (driver) => {
          const totalTrips = await Trip.countDocuments({
            driverId: driver._id,
            status: "delivered",
          });

          const totalRevenueAgg = await Trip.aggregate([
            { $match: { driverId: driver._id, status: "delivered" } },
            { $group: { _id: null, total: { $sum: "$deliveryFee" } } },
          ]);

          const totalRevenue =
            totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

          const assignedVehicle = await Vehicle.findOne({
            driverId: driver._id,
          }).select("brand model plateNumber status type");

          return {
            driver,
            stats: {
              totalTrips,
              totalRevenue,
              assignedVehicle: assignedVehicle || null,
            },
          };
        })
      );

      res.json({ ok: true, count: driverStats.length, drivers: driverStats });
    } catch (err) {
      console.error("❌ Error loading company drivers:", err.message);
      res.status(500).json({ error: "Server error loading drivers" });
    }
  }
);
/* ==========================================================
   🟡 SUSPEND OR ACTIVATE DRIVER
   ========================================================== */
router.patch(
  "/toggle-status/:driverId",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { driverId } = req.params;

      let driver = await User.findOne({
        _id: driverId,
        role: "driver",
      });

      if (!driver)
        return res.status(404).json({ error: "Driver not found" });

      driver.isActive = !driver.isActive;
      await driver.save();

      res.json({
        ok: true,
        message: `Driver is now ${driver.isActive ? "ACTIVE" : "SUSPENDED"}`,
      });
    } catch (err) {
      console.error("❌ Error toggling driver:", err.message);
      res.status(500).json({ error: "Server error updating driver" });
    }
  }
);
/* ==========================================================
   📊 DRIVER DETAILS + FULL ANALYTICS
   ========================================================== */
router.get(
  "/details/:driverId",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { driverId } = req.params;

      const driver = await User.findById(driverId).select(
        "name email profileImage isActive createdAt"
      );

      if (!driver) return res.status(404).json({ error: "Driver not found" });

      const trips = await Trip.find({
        driverId,
        status: "delivered",
      }).sort({ createdAt: -1 });

      const totalTrips = trips.length;
      const totalRevenue = trips.reduce((sum, t) => sum + t.deliveryFee, 0);

      const avgTime =
        totalTrips > 0
          ? Math.round(
              trips.reduce(
                (sum, t) =>
                  sum +
                  (new Date(t.endTime).getTime() -
                    new Date(t.startTime).getTime()) /
                    60000,
                0
              ) / totalTrips
            )
          : 0;

      res.json({
        ok: true,
        driver,
        stats: {
          totalTrips,
          totalRevenue,
          avgDeliveryTimeMin: avgTime,
          recentTrips: trips.slice(0, 10),
        },
      });
    } catch (err) {
      console.error("❌ Error loading driver details:", err.message);
      res.status(500).json({ error: "Server error loading driver details" });
    }
  }
);
/* ==========================================================
   🚚 GET ACTIVE DRIVERS (FOR ASSIGNING TRIPS)
   ========================================================== */
router.get(
  "/active",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const drivers = await User.find({
        companyId,
        role: "driver",
        isActive: true,
      }).select("name email profileImage");

      res.json({ ok: true, count: drivers.length, drivers });
    } catch (err) {
      console.error("❌ Error finding drivers:", err.message);
      res.status(500).json({ error: "Server error fetching active drivers" });
    }
  }
);

export default router;
