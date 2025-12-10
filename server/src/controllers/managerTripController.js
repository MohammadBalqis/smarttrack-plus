// server/src/controllers/managerTripController.js
import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { createDriverNotification } from "../controllers/driverNotificationController.js";

/* Resolve companyId */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   1) GET ALL TRIPS (company → all, manager → only their shop)
========================================================== */
export const getManagerTrips = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });

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

    if (status) filter.status = status;
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
      .populate("driverId", "name phone")
      .populate("customerId", "name")
      .populate("vehicleId", "plateNumber");

    const total = await Trip.countDocuments(filter);

    res.json({
      ok: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      trips,
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
      .populate("driverId", "name phone")
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
   3) TRIP TIMELINE (history)
========================================================== */
export const getManagerTripTimeline = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const isManager = req.user.role === "manager";
    const shopId = isManager ? req.user.shopId : null;

    const filter = { _id: req.params.id, companyId };
    if (shopId) filter.shopId = shopId;

    const trip = await Trip.findOne(filter).select(
      "timeline status createdAt updatedAt"
    );

    if (!trip) {
      return res.status(404).json({
        ok: false,
        error: "Trip not found for your shop/company",
      });
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
   4) TRIP SUMMARY (for dashboard or reports)
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
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
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
