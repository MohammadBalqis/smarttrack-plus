// server/src/controllers/companyDashboardController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";

/* Helper: resolve companyId from logged-in user */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) {
    return user.companyId;
  }
  return null;
};

/* ==========================================================
   📊 COMPANY DASHBOARD SUMMARY
========================================================== */
export const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "Unable to resolve companyId from user." });
    }

    const companyObjectId =
      companyId instanceof mongoose.Types.ObjectId
        ? companyId
        : new mongoose.Types.ObjectId(companyId);

    /* ---------- BASIC COUNTS ---------- */

    const [
      totalDrivers,
      activeDrivers,
      totalVehicles,
      availableVehicles,
      totalTrips,
      activeTrips,
      totalOrders,
      pendingOrders,
      uniqueCustomerIds,
    ] = await Promise.all([
      // drivers
      User.countDocuments({ role: "driver", companyId: companyObjectId }),
      User.countDocuments({
        role: "driver",
        companyId: companyObjectId,
        isActive: true,
      }),

      // vehicles
      Vehicle.countDocuments({ companyId: companyObjectId }),
      Vehicle.countDocuments({
        companyId: companyObjectId,
        status: "available",
      }),

      // trips
      Trip.countDocuments({ companyId: companyObjectId }),
      Trip.countDocuments({
        companyId: companyObjectId,
        status: { $in: ["assigned", "in_progress"] },
      }),

      // orders
      Order.countDocuments({ companyId: companyObjectId }),
      Order.countDocuments({
        companyId: companyObjectId,
        status: {
          $in: ["pending", "accepted", "preparing", "assigned", "delivering"],
        },
      }),

      // unique customers (via orders)
      Order.distinct("customerId", { companyId: companyObjectId }),
    ]);

    const totalCustomers = uniqueCustomerIds.length;

    /* ---------- REVENUE (last 6 months) ---------- */

    const revenueAgg = await Payment.aggregate([
      {
        $match: {
          companyId: companyObjectId,
          status: "paid",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalCompanyEarning: { $sum: "$companyEarning" },
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 },
      },
      { $limit: 6 },
    ]);

    const revenueLast6Months = revenueAgg
      .map((item) => {
        const { year, month } = item._id;
        const label = `${year}-${String(month).padStart(2, "0")}`;
        return {
          label,
          totalCompanyEarning: item.totalCompanyEarning,
        };
      })
      .reverse(); // oldest → newest

    const totalRevenue =
      revenueLast6Months.reduce(
        (sum, r) => sum + (r.totalCompanyEarning || 0),
        0
      ) || 0;

    /* ---------- TOP DRIVERS (by delivered trips) ---------- */

    const topDriversAgg = await Trip.aggregate([
      {
        $match: {
          companyId: companyObjectId,
          status: "delivered",
          driverId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$driverId",
          deliveredTrips: { $sum: 1 },
          totalDistance: { $sum: "$totalDistance" },
        },
      },
      { $sort: { deliveredTrips: -1 } },
      { $limit: 5 },
    ]);

    const driverIds = topDriversAgg.map((d) => d._id);
    const driverDocs = await User.find({ _id: { $in: driverIds } })
      .select("name email")
      .lean();

    const topDrivers = topDriversAgg.map((d) => {
      const doc = driverDocs.find(
        (u) => String(u._id) === String(d._id)
      );
      return {
        id: d._id,
        name: doc?.name || "Unknown driver",
        email: doc?.email || "",
        deliveredTrips: d.deliveredTrips,
        totalDistance: d.totalDistance || 0,
      };
    });

    /* ---------- RECENT TRIPS ---------- */

    const recentTripsDocs = await Trip.find({
      companyId: companyObjectId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("driverId", "name")
      .populate("customerId", "name")
      .lean();

    const recentTrips = recentTripsDocs.map((t) => ({
      id: t._id,
      status: t.status,
      pickupAddress: t.pickupLocation?.address || "",
      dropoffAddress: t.dropoffLocation?.address || "",
      driverName: t.driverId?.name || "—",
      customerName: t.customerId?.name || "—",
      createdAt: t.createdAt,
    }));

    /* ---------- RECENT ORDERS ---------- */

    const recentOrdersDocs = await Order.find({
      companyId: companyObjectId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name")
      .lean();

    const recentOrders = recentOrdersDocs.map((o) => ({
      id: o._id,
      status: o.status,
      total: o.total || 0,
      customerName: o.customerId?.name || "—",
      createdAt: o.createdAt,
    }));

    return res.json({
      ok: true,
      kpis: {
        totalDrivers,
        activeDrivers,
        totalVehicles,
        availableVehicles,
        totalTrips,
        activeTrips,
        totalOrders,
        pendingOrders,
        totalCustomers,
        totalRevenue,
      },
      revenueLast6Months,
      topDrivers,
      recentTrips,
      recentOrders,
    });
  } catch (err) {
    console.error("❌ getCompanyDashboard error:", err.message);
    return res
      .status(500)
      .json({ error: "Server error loading company dashboard" });
  }
};
