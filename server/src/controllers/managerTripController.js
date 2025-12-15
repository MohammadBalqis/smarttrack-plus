import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { createDriverNotification } from "../controllers/driverNotificationController.js";

/* ==========================================================
   Resolve companyId
========================================================== */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   🔁 DRIVER STATUS HELPERS (SAFE)
========================================================== */
const setDriverOnTrip = async (driverId) => {
  if (!driverId) return;
  await User.findByIdAndUpdate(driverId, {
    driverStatus: "on_trip",
    isActive: true,
  });
};

const setDriverOnline = async (driverId) => {
  if (!driverId) return;
  await User.findByIdAndUpdate(driverId, {
    driverStatus: "online",
    isActive: true,
  });
};

/* ==========================================================
   1) GET ALL TRIPS (MANAGER VIEW)
========================================================== */
export const getManagerTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    let {
      status,
      driverId,
      customerId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 20;

    const filter = { companyId };
    if (shopId) filter.shopId = shopId;

    /* ======================================================
       🔥 IMPORTANT FIX #1
       Hide completed trips by default
    ====================================================== */
    if (!status) {
      filter.status = { $in: ["assigned", "in_progress"] };
    } else {
      filter.status = status;
    }

    if (driverId) filter.driverId = driverId;
    if (customerId) filter.customerId = customerId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("driverId", "name phone driverStatus")
      .populate("customerId", "name phone")
      .populate("vehicleId", "plateNumber brand model");

    const total = await Trip.countDocuments(filter);

    /* ======================================================
       🔥 IMPORTANT FIX #2
       Count active trips per driver
    ====================================================== */
    const driverIds = trips
      .map((t) => t.driverId?._id)
      .filter(Boolean);

    const activeCounts = await Trip.aggregate([
      {
        $match: {
          companyId,
          status: { $in: ["assigned", "in_progress"] },
          driverId: { $in: driverIds },
        },
      },
      {
        $group: {
          _id: "$driverId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    activeCounts.forEach((d) => {
      countMap[String(d._id)] = d.count;
    });

    /* ======================================================
       🔥 IMPORTANT FIX #3
       Compute delivery duration
    ====================================================== */
    const enrichedTrips = trips.map((t) => {
      let durationMinutes = null;

      if (t.startTime && t.endTime) {
        durationMinutes = Math.round(
          (new Date(t.endTime) - new Date(t.startTime)) / 60000
        );
      }

      return {
        ...t.toObject(),
        deliveryDurationMinutes: durationMinutes,
        driverActiveOrders:
          countMap[String(t.driverId?._id)] || 0,
      };
    });

    res.json({
      ok: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      trips: enrichedTrips,
    });
  } catch (err) {
    console.error("❌ getManagerTrips error:", err.message);
    res
      .status(500)
      .json({ ok: false, error: "Server error fetching trips" });
  }
};

/* ==========================================================
   2) SINGLE TRIP DETAILS
========================================================== */
export const getManagerTripDetails = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const filter = { _id: req.params.id, companyId };
    if (shopId) filter.shopId = shopId;

    const trip = await Trip.findOne(filter)
      .populate("driverId", "name phone driverStatus")
      .populate("customerId", "name phone")
      .populate("vehicleId", "plateNumber brand model");

    if (!trip) {
      return res.status(404).json({
        ok: false,
        error: "Trip not found or unauthorized",
      });
    }

    const payment = await Payment.findOne({ tripId: trip._id });

    res.json({
      ok: true,
      trip,
      payment,
    });
  } catch (err) {
    console.error("❌ getManagerTripDetails error:", err.message);
    res
      .status(500)
      .json({ ok: false, error: "Server error loading trip" });
  }
};

/* ==========================================================
   3) TRIP TIMELINE (AUTO DRIVER STATUS SYNC)
========================================================== */
export const getManagerTripTimeline = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const filter = { _id: req.params.id, companyId };
    if (shopId) filter.shopId = shopId;

    const trip = await Trip.findOne(filter).select(
      "timeline status createdAt updatedAt driverId"
    );

    if (!trip) {
      return res.status(404).json({
        ok: false,
        error: "Trip not found for your shop/company",
      });
    }

    if (["assigned", "in_progress"].includes(trip.status)) {
      await setDriverOnTrip(trip.driverId);
    }

    if (["delivered", "cancelled"].includes(trip.status)) {
      await setDriverOnline(trip.driverId);
    }

    const timeline = [...(trip.timeline || [])].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    res.json({
      ok: true,
      tripId: trip._id,
      status: trip.status,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      timeline,
    });
  } catch (err) {
    console.error("❌ getManagerTripTimeline error:", err.message);
    res
      .status(500)
      .json({ ok: false, error: "Server error fetching timeline" });
  }
};

/* ==========================================================
   4) TRIP SUMMARY (KPI CARDS)
========================================================== */
export const getManagerTripSummary = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const match = { companyId };
    if (shopId) match.shopId = shopId;

    const agg = await Trip.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const summary = {
      assigned: 0,
      in_progress: 0,
      delivered: 0,
      cancelled: 0,
      total: 0,
    };

    agg.forEach((row) => {
      summary[row._id] = row.count;
      summary.total += row.count;
    });

    res.json({ ok: true, summary });
  } catch (err) {
    console.error("❌ getManagerTripSummary error:", err.message);
    res
      .status(500)
      .json({ ok: false, error: "Server error summarizing trips" });
  }
};
/* ==========================================================
   ✅ 5) TRIP STATS (KPI CARDS)
   GET /api/manager/trips/stats
   Returns:
   { totalTrips, deliveredTrips, activeTrips, cancelledTrips, pendingTrips, totalRevenue }
========================================================== */
export const getManagerTripStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const { status, startDate, endDate } = req.query;

    const match = { companyId };
    if (shopId) match.shopId = shopId;

    // optional filters
    if (status) match.status = status;

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const result = await Trip.aggregate([
      { $match: match },
      {
        $facet: {
          counts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          revenue: [
            { $match: { status: "delivered" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ],
          total: [{ $count: "totalTrips" }],
        },
      },
    ]);

    const counts = result?.[0]?.counts || [];
    const revenue = result?.[0]?.revenue?.[0]?.total || 0;
    const totalTrips = result?.[0]?.total?.[0]?.totalTrips || 0;

    const map = {};
    counts.forEach((c) => (map[c._id] = c.count));

    const deliveredTrips = map.delivered || 0;
    const cancelledTrips = map.cancelled || 0;
    const pendingTrips = map.pending || 0;

    const activeTrips =
      (map.assigned || 0) + (map.in_progress || 0);

    return res.json({
      ok: true,
      stats: {
        totalTrips,
        deliveredTrips,
        activeTrips,
        cancelledTrips,
        pendingTrips,
        totalRevenue: revenue,
      },
    });
  } catch (err) {
    console.error("❌ getManagerTripStats error:", err.message);
    return res
      .status(500)
      .json({ ok: false, error: "Server error loading trip stats" });
  }
};
