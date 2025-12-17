import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

export const getDriverDashboardStats = async (req, res) => {
  try {
    const driverId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayTrips, totalTrips] = await Promise.all([
      Trip.countDocuments({ driverId, createdAt: { $gte: today } }),
      Trip.countDocuments({ driverId }),
    ]);

    const [todayPayments, totalPayments] = await Promise.all([
      Payment.aggregate([
        { $match: { driverId, createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        { $match: { driverId } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      ok: true,
      dashboard: {
        todayTrips,
        totalTrips,
        todayEarnings: todayPayments[0]?.total || 0,
        totalEarnings: totalPayments[0]?.total || 0,
        isOnline: req.user.isOnline ?? false,
      },
    });
  } catch (err) {
    console.error("Driver dashboard error:", err);
    res.status(500).json({ error: "Failed to load driver dashboard" });
  }
};
