import Trip from "../models/Trip.js";
export const getDriverTrips = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    if (req.user.role !== "driver") {
      return res.status(403).json({
        ok: false,
        error: "Only drivers can view driver trips.",
      });
    }

    const driverId = req.user._id;

    // ---------------------------------------------
    // 🔎 Query params
    // ---------------------------------------------
    let {
      status = "all",
      from,
      to,
      page = 1,
      limit = 10,
      range,
      sort = "newest",
      q,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;
    if (limit > 100) limit = 100;

    // ---------------------------------------------
    // 🔍 Base filter
    // ---------------------------------------------
    const filter = { driverId };

    // ---------------------------------------------
    // 🔹 Status Filter
    // ---------------------------------------------
    const allowed = ["pending", "assigned", "in_progress", "delivered", "cancelled"];
    if (status !== "all") {
      if (!allowed.includes(status)) {
        return res.status(400).json({ ok: false, error: "Invalid status filter." });
      }
      filter.status = status;
    }

    // ---------------------------------------------
    // 🔹 Quick Range Filters (D9.2 NEW)
    // ---------------------------------------------
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (range) {
      filter.createdAt = {};

      if (range === "today") {
        filter.createdAt.$gte = startOfToday;
      } else if (range === "yesterday") {
        const y = new Date(startOfToday);
        y.setDate(y.getDate() - 1);
        filter.createdAt.$gte = y;
        filter.createdAt.$lte = new Date(startOfToday.getTime() - 1);
      } else if (range === "this_week") {
        filter.createdAt.$gte = startOfWeek;
      } else if (range === "this_month") {
        filter.createdAt.$gte = startOfMonth;
      } else if (range === "last_7_days") {
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        filter.createdAt.$gte = d;
      }
    }

    // ---------------------------------------------
    // 🔹 Manual date range
    // ---------------------------------------------
    if (from || to) {
      filter.createdAt = filter.createdAt || {};

      if (from) {
        const f = new Date(from);
        if (!isNaN(f.getTime())) filter.createdAt.$gte = f;
      }

      if (to) {
        const t = new Date(to);
        if (!isNaN(t.getTime())) {
          t.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = t;
        }
      }
    }

    // ---------------------------------------------
    // 🔹 Search by customer name or phone (D9.2 NEW)
    // ---------------------------------------------
    if (q && q.trim() !== "") {
      filter.$or = [
        { customerPhone: { $regex: q, $options: "i" } },
        { customerAddress: { $regex: q, $options: "i" } },
      ];
    }

    // ---------------------------------------------
    // 🔹 Sorting (D9.2 NEW)
    // ---------------------------------------------
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      fee_high: { deliveryFee: -1 },
      fee_low: { deliveryFee: 1 },
      distance_high: { totalDistance: -1 },
      distance_low: { totalDistance: 1 },
    };

    const sortOption = sortMap[sort] || sortMap["newest"];

    const skip = (page - 1) * limit;

    // ---------------------------------------------
    // 📦 Query results
    // ---------------------------------------------
    const [total, trips] = await Promise.all([
      Trip.countDocuments(filter),
      Trip.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate("companyId", "name")
        .populate("customerId", "name phone"),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    // ---------------------------------------------
    // 📊 Extra stats (D9.2 NEW)
    // ---------------------------------------------
    const statsAgg = await Trip.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          totalDistance: { $sum: "$totalDistance" },
          avgDistance: { $avg: "$totalDistance" },
          avgDuration: {
            $avg: {
              $cond: [
                { $and: ["$startTime", "$endTime"] },
                { $subtract: ["$endTime", "$startTime"] },
                null,
              ],
            },
          },
          totalEarnings: { $sum: "$driverEarning" },
        },
      },
    ]);

    const stats = statsAgg[0] || {
      delivered: 0,
      cancelled: 0,
      totalDistance: 0,
      avgDistance: 0,
      avgDuration: 0,
      totalEarnings: 0,
    };

    return res.json({
      ok: true,
      trips,
      page,
      limit,
      total,
      totalPages,
      stats,
      filters: { status, from, to, range, q, sort },
    });
  } catch (err) {
    console.error("getDriverTrips error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error loading driver trips.",
    });
  }
};
