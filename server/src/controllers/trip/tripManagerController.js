// server/src/controllers/trip/tripManagerController.js
import Trip from "../../models/Trip.js";
import Payment from "../../models/Payment.js";
import GlobalSettings from "../../models/GlobalSettings.js";

/* Helper: maintenance guard (same pattern as other controllers) */
const ensureNotInMaintenance = async (req, res) => {
  const settings = await GlobalSettings.findOne();
  if (settings?.maintenanceMode && req.user.role !== "superadmin") {
    res.status(503).json({
      ok: false,
      error: "System is under maintenance.",
    });
    return false;
  }
  return true;
};

/* Helper: resolve companyId from user */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   📊 MANAGER TRIPS STATS (only for his company)
   - totalTrips
   - deliveredTrips
   - activeTrips (assigned + in_progress)
   - cancelledTrips
   - pendingTrips
   - totalRevenue (from Payment)
========================================================== */
export const getManagerTripStats = async (req, res) => {
  try {
    if (!(await ensureNotInMaintenance(req, res))) return;

    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve company for this manager.",
      });
    }

    const {
      status,
      startDate,
      endDate,
    } = req.query;

    // Trip filter (by company + optional date range + optional status)
    const tripFilter = { companyId };

    if (status) {
      tripFilter.status = status;
    }

    if (startDate || endDate) {
      tripFilter.createdAt = {};
      if (startDate) tripFilter.createdAt.$gte = new Date(startDate);
      if (endDate) tripFilter.createdAt.$lte = new Date(endDate);
    }

    const trips = await Trip.find(tripFilter).select(
      "status totalAmount createdAt"
    );

    const totalTrips = trips.length;
    const activeStatuses = ["assigned", "in_progress"];

    let deliveredTrips = 0;
    let cancelledTrips = 0;
    let pendingTrips = 0;
    let activeTrips = 0;

    for (const t of trips) {
      if (t.status === "delivered") deliveredTrips++;
      else if (t.status === "cancelled") cancelledTrips++;
      else if (t.status === "pending") pendingTrips++;
      if (activeStatuses.includes(t.status)) activeTrips++;
    }

    // Revenue from Payment model (only for this company)
    const paymentFilter = { companyId };

    if (startDate || endDate) {
      paymentFilter.paidAt = paymentFilter.paidAt || {};
      if (startDate) paymentFilter.paidAt.$gte = new Date(startDate);
      if (endDate) paymentFilter.paidAt.$lte = new Date(endDate);
    }

    const paymentAgg = await Payment.aggregate([
      {
        $match: {
          companyId,
          status: "paid",
          ...(paymentFilter.paidAt ? { paidAt: paymentFilter.paidAt } : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue =
      paymentAgg.length > 0 ? paymentAgg[0].totalRevenue : 0;

    res.json({
      ok: true,
      stats: {
        totalTrips,
        deliveredTrips,
        activeTrips,
        cancelledTrips,
        pendingTrips,
        totalRevenue,
      },
    });
  } catch (err) {
    console.error("❌ getManagerTripStats error:", err.message);
    res.status(500).json({
      ok: false,
      error: "Server error fetching manager trip stats",
    });
  }
};
