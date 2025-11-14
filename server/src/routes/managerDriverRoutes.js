// server/src/routes/managerDriverRoutes.js
import { Router } from "express";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🚗 GET ALL DRIVERS WITH BASIC INFO + STATUS + VEHICLE
   ========================================================== */
router.get(
  "/drivers",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const drivers = await User.find({
        companyId,
        role: "driver",
      })
        .select("name email phone profileImage isActive onlineStatus")
        .lean();

      // Attach vehicle for each driver
      const driverIds = drivers.map((d) => d._id);

      const vehicles = await Vehicle.find({
        driverId: { $in: driverIds },
      }).lean();

      const formatted = drivers.map((driver) => ({
        ...driver,
        assignedVehicle: vehicles.find(
          (v) => String(v.driverId) === String(driver._id)
        ) || null,
      }));

      res.json({
        ok: true,
        count: formatted.length,
        drivers: formatted,
      });
    } catch (err) {
      console.error("❌ Fetch drivers error:", err.message);
      res.status(500).json({ error: "Error fetching drivers" });
    }
  }
);
/* ==========================================================
   🏆 DRIVER PERFORMANCE STATISTICS
   ========================================================== */
router.get(
  "/driver/:driverId/stats",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { driverId } = req.params;

      const totalDelivered = await Trip.countDocuments({
        driverId,
        status: "delivered",
      });

      const totalAssigned = await Trip.countDocuments({
        driverId,
        status: { $in: ["assigned", "in_progress"] },
      });

      const totalDistance = await Trip.aggregate([
        { $match: { driverId: req.mongooseId(driverId) } },
        { $group: { _id: null, distance: { $sum: "$totalDistance" } } },
      ]);

      res.json({
        ok: true,
        stats: {
          delivered: totalDelivered,
          activeTrips: totalAssigned,
          totalDistance:
            totalDistance.length ? totalDistance[0].distance : 0,
        },
      });
    } catch (err) {
      console.error("❌ Driver stats error:", err.message);
      res.status(500).json({ error: "Error loading driver statistics" });
    }
  }
);
/* ==========================================================
   📜 DRIVER RECENT TRIPS (last 20)
   ========================================================== */
router.get(
  "/driver/:driverId/recent-trips",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { driverId } = req.params;

      const trips = await Trip.find({
        driverId,
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("vehicleId", "brand model plateNumber")
        .populate("customerId", "name phone");

      res.json({
        ok: true,
        trips,
      });
    } catch (err) {
      console.error("❌ Recent trips error:", err.message);
      res.status(500).json({ error: "Error fetching recent trips" });
    }
  }
);
/* ==========================================================
   ⛔ SUSPEND / ACTIVATE DRIVER
   ========================================================== */
router.put(
  "/driver/:driverId/status",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      const { driverId } = req.params;
      const { isActive } = req.body;

      const updated = await User.findByIdAndUpdate(
        driverId,
        { isActive },
        { new: true }
      );

      res.json({
        ok: true,
        message: isActive ? "Driver activated" : "Driver suspended",
        driver: updated,
      });
    } catch (err) {
      console.error("❌ Change driver status error:", err.message);
      res.status(500).json({ error: "Error updating driver status" });
    }
  }
);

export default router;
