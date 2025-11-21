import Trip from "../models/Trip.js";
import User from "../models/User.js";

/* Helper: get companyId from user */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) {
    return user.companyId;
  }
  return null;
};

export const getCompanyDashboardStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Cannot detect company." });
    }

    // Get all delivered trips for this company (you can tweak filters later)
    const trips = await Trip.find({
      companyId,
      status: "delivered",
    })
      .populate("driverId", "name")
      .sort({ createdAt: -1 });

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalTrips = trips.length;
    let totalRevenue = 0;

    let tripsToday = 0;
    let revenueToday = 0;

    let tripsThisMonth = 0;
    let revenueThisMonth = 0;

    // For charts
    const timelineMap = new Map(); // dateStr -> { totalTrips, totalRevenue }
    const driverMap = new Map(); // driverId -> { driverId, driverName, totalTrips, totalRevenue }

    for (const trip of trips) {
      const amount = trip.totalAmount || 0;
      const createdAt = new Date(trip.createdAt);

      totalRevenue += amount;

      // Today stats
      if (createdAt >= startOfToday) {
        tripsToday += 1;
        revenueToday += amount;
      }

      // This month stats
      if (createdAt >= startOfMonth) {
        tripsThisMonth += 1;
        revenueThisMonth += amount;
      }

      // Timeline aggregation by date
      const dateKey = createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, {
          date: dateKey,
          totalTrips: 0,
          totalRevenue: 0,
        });
      }
      const tl = timelineMap.get(dateKey);
      tl.totalTrips += 1;
      tl.totalRevenue += amount;

      // Driver aggregation
      if (trip.driverId) {
        const dId = String(trip.driverId._id);
        if (!driverMap.has(dId)) {
          driverMap.set(dId, {
            driverId: dId,
            driverName: trip.driverId.name || "Unknown Driver",
            totalTrips: 0,
            totalRevenue: 0,
          });
        }
        const d = driverMap.get(dId);
        d.totalTrips += 1;
        d.totalRevenue += amount;
      }
    }

    const kpis = {
      totalTrips,
      totalRevenue,
      tripsToday,
      revenueToday,
      tripsThisMonth,
      revenueThisMonth,
    };

    const timeline = Array.from(timelineMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const driverStats = Array.from(driverMap.values()).sort(
      (a, b) => b.totalTrips - a.totalTrips
    );

    const lastTrips = trips.slice(0, 10).map((t) => ({
      id: t._id,
      driverName: t.driverId?.name || "Unassigned",
      status: t.status,
      totalAmount: t.totalAmount || 0,
      createdAt: t.createdAt,
      pickupAddress: t.pickupLocation?.address || "",
      dropoffAddress: t.dropoffLocation?.address || "",
  }));

    res.json({
      ok: true,
      kpis,
      timeline,
      driverStats,
      lastTrips,
    });
  } catch (error) {
    console.error("❌ getCompanyDashboardStats error:", error);
    res.status(500).json({ error: "Server error fetching dashboard stats." });
  }
};
