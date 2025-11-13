import { Router } from "express";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   📊 TRIP ANALYTICS (for owner, company, manager)
   ========================================================== */
router.get("/", protect, authorizeRoles("owner", "company", "manager"), async (req, res) => {
  try {
    let filter = {};

    // 🧭 Company/Manager filter
    if (req.user.role === "company") {
      filter.companyId = req.user._id;
    } else if (req.user.role === "manager") {
      filter.companyId = req.user.companyId;
    }

    // 🧮 Aggregate analytics
    const trips = await Trip.find(filter);

    if (trips.length === 0) {
      return res.json({
        ok: true,
        message: "No trips yet for analytics",
        stats: {
          totalTrips: 0,
          completedTrips: 0,
          activeTrips: 0,
          totalRevenue: 0,
          averageDuration: 0,
          totalDistance: 0,
        },
      });
    }

    // ✅ Compute main metrics
    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === "delivered").length;
    const activeTrips = trips.filter(t => ["assigned", "in_progress"].includes(t.status)).length;
    const totalRevenue = trips.reduce((sum, t) => sum + (t.deliveryFee || 0), 0);
    const totalDistance = trips.reduce((sum, t) => sum + (t.totalDistance || 0), 0);

    // 🕒 Average Delivery Duration
    const completedDurations = trips
      .filter(t => t.status === "delivered" && t.startTime && t.endTime)
      .map(t => (new Date(t.endTime) - new Date(t.startTime)) / 1000 / 60); // minutes
    const averageDuration = completedDurations.length
      ? (completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length).toFixed(2)
      : 0;

    // 👨‍✈️ Top Drivers by Deliveries
    const driverStats = {};
    for (const trip of trips) {
      if (trip.driverId) {
        const id = trip.driverId.toString();
        driverStats[id] = (driverStats[id] || 0) + 1;
      }
    }

    const topDrivers = Object.entries(driverStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topDriverDetails = await Promise.all(
      topDrivers.map(async ([driverId, count]) => {
        const driver = await User.findById(driverId).select("name email profileImage");
        return {
          name: driver?.name || "Unknown",
          email: driver?.email || "N/A",
          tripsCompleted: count,
        };
      })
    );

    // ✅ Respond
    res.json({
      ok: true,
      message: "Trip analytics calculated successfully",
      stats: {
        totalTrips,
        completedTrips,
        activeTrips,
        totalRevenue,
        totalDistance,
        averageDuration,
        topDrivers: topDriverDetails,
      },
    });
  } catch (err) {
    console.error("❌ Error generating analytics:", err.message);
    res.status(500).json({ error: "Server error while calculating analytics" });
  }
});

export default router;
