// server/src/controllers/managerDashboardController.js
import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";

import { resolveCompanyId } from "../utils/resolveCompanyId.js";

/* ==========================================================
   📊 MANAGER / COMPANY DASHBOARD OVERVIEW
   - company: sees all company data
   - manager: restricted to their shopId
========================================================== */
export const getManagerDashboardOverview = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    if (!companyId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve company ID for this manager.",
      });
    }

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    // Date range filters
    const { startDate, endDate } = req.query;

    const tripMatch = { companyId };
    const payMatch = { companyId, status: "paid" };

    if (shopId) {
      tripMatch.shopId = shopId;
      payMatch.shopId = shopId;
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      tripMatch.createdAt = dateFilter;
      payMatch.createdAt = dateFilter;
    }

    // Today range
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23, 59, 59
    );

    const todayTripMatch = {
      companyId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    };

    const todayPayMatch = {
      companyId,
      status: "paid",
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    };

    if (shopId) {
      todayTripMatch.shopId = shopId;
      todayPayMatch.shopId = shopId;
    }

    const [
      totalTrips,
      activeTrips,
      deliveredTrips,
      cancelledTrips,
      paymentsAgg,
      todayTrips,
      todayPaymentsAgg,
      driversCount,
      vehiclesCount,
      recentTrips,
    ] = await Promise.all([
      Trip.countDocuments(tripMatch),
      Trip.countDocuments({
        ...tripMatch,
        status: { $in: ["assigned", "in_progress"] },
      }),
      Trip.countDocuments({ ...tripMatch, status: "delivered" }),
      Trip.countDocuments({ ...tripMatch, status: "cancelled" }),

      Payment.aggregate([
        { $match: payMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            companyEarnings: { $sum: "$companyEarning" },
            driverEarnings: { $sum: "$driverEarning" },
          },
        },
      ]),

      Trip.countDocuments(todayTripMatch),

      Payment.aggregate([
        { $match: todayPayMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ]),

      // drivers only for this company (+shop if manager)
      User.countDocuments({
        role: "driver",
        companyId,
        ...(shopId ? { shopId } : {}),
      }),

      // vehicles — if later you add shopId on Vehicle, this filter will work too
      Vehicle.countDocuments({
        companyId,
        ...(shopId ? { shopId } : {}),
      }),

      Trip.find(tripMatch)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("driverId", "name email")
        .populate("customerId", "name")
        .populate("vehicleId", "plateNumber"),
    ]);

    const paymentsSummary = paymentsAgg[0] || {
      totalRevenue: 0,
      companyEarnings: 0,
      driverEarnings: 0,
    };

    const todayPaymentsSummary = todayPaymentsAgg[0] || {
      totalRevenue: 0,
    };

    res.json({
      ok: true,
      stats: {
        totalTrips,
        activeTrips,
        deliveredTrips,
        cancelledTrips,

        totalRevenue: paymentsSummary.totalRevenue,
        companyEarnings: paymentsSummary.companyEarnings,
        driverEarnings: paymentsSummary.driverEarnings,

        todayTrips,
        todayRevenue: todayPaymentsSummary.totalRevenue,

        driversCount,
        vehiclesCount,
      },
      recentTrips: recentTrips.map((t) => ({
        id: t._id,
        status: t.status,
        createdAt: t.createdAt,
        totalAmount: t.totalAmount || 0,
        driverName: t.driverId?.name || "—",
        customerName: t.customerId?.name || "—",
        vehiclePlate: t.vehicleId?.plateNumber || "—",
      })),
    });
  } catch (err) {
    console.error("❌ getManagerDashboardOverview error:", err);
    res.status(500).json({
      ok: false,
      error: "Server error loading manager dashboard",
    });
  }
};
