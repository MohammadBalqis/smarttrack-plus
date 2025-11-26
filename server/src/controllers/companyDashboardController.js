// server/src/controllers/companyDashboardController.js
import Trip from "../models/Trip.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role))
    return user.companyId;
  return null;
};

/* ==========================================================
   📊 MAIN DASHBOARD STATS
========================================================== */
export const getCompanyDashboardStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    const [trips, orders, payments, drivers, customers] = await Promise.all([
      Trip.countDocuments({ companyId }),
      Order.countDocuments({ companyId }),
      Payment.countDocuments({ companyId }),
      User.countDocuments({ companyId, role: "driver" }),
      User.countDocuments({ companyId, role: "customer" }),
    ]);

    const deliveredTrips = await Trip.countDocuments({
      companyId,
      status: "delivered",
    });

    const totalRevenue = await Payment.aggregate([
      { $match: { companyId } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      ok: true,
      stats: {
        totalTrips: trips,
        deliveredTrips,
        totalOrders: orders,
        totalPayments: payments,
        totalDrivers: drivers,
        totalCustomers: customers,
        totalRevenue: totalRevenue.length ? totalRevenue[0].total : 0,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Server error loading dashboard stats" });
  }
};

/* ==========================================================
   🚗 RECENT TRIPS
========================================================== */
export const getCompanyDashboardRecentTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    const trips = await Trip.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("driverId", "name")
      .populate("customerId", "name");

    res.json({ ok: true, trips });
  } catch (err) {
    console.error("Recent trips error:", err);
    res.status(500).json({ error: "Server error loading recent trips" });
  }
};

/* ==========================================================
   🧾 RECENT ORDERS
========================================================== */
export const getCompanyDashboardRecentOrders = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    const orders = await Order.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name")
      .populate("driverId", "name");

    res.json({ ok: true, orders });
  } catch (err) {
    console.error("Recent orders error:", err);
    res.status(500).json({ error: "Server error loading recent orders" });
  }
};

/* ==========================================================
   💳 RECENT PAYMENTS
========================================================== */
export const getCompanyDashboardRecentPayments = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    const payments = await Payment.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name")
      .populate("driverId", "name");

    res.json({ ok: true, payments });
  } catch (err) {
    console.error("Recent payments error:", err);
    res.status(500).json({ error: "Server error loading payments" });
  }
};
