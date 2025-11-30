// server/src/controllers/managerPaymentsController.js
import Payment from "../models/Payment.js";
import { resolveCompanyIdFromUser } from "../utils/resolveCompanyId.js";

/* ==========================================================
   📌 GET MANAGER PAYMENTS (LIST + FILTERS)
========================================================== */
export const getManagerPayments = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);

    if (!companyId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve companyId.",
      });
    }

    let {
      status,
      method,
      search,
      dateFrom,
      dateTo,
      page = 1,
      limit = 15,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const filter = { companyId };

    if (status) filter.status = status;
    if (method) filter.method = method;

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    /* ======================================================
       🔎 SEARCH (now done directly in Mongo, fast!)
    ======================================================= */
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();

      filter.$or = [
        { "customerId.name": { $regex: q, $options: "i" } },
        { "driverId.name": { $regex: q, $options: "i" } },
        { "tripId": { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("customerId", "name email phone")
        .populate("driverId", "name email phone")
        .populate("tripId", "_id status deliveryFee")
        .lean(),
    ]);

    res.json({
      ok: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      payments,
    });
  } catch (err) {
    console.error("❌ getManagerPayments error:", err);
    res.status(500).json({ ok: false, error: "Server error fetching payments." });
  }
};

/* ==========================================================
   🔎 GET SINGLE PAYMENT DETAILS
========================================================== */
export const getManagerPaymentDetails = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);
    if (!companyId) {
      return res
        .status(400)
        .json({ ok: false, error: "Unable to resolve companyId" });
    }

    const { id } = req.params; // FIXED

    const payment = await Payment.findOne({
      _id: id,
      companyId,
    })
      .populate("customerId", "name email phone")
      .populate("driverId", "name email phone")
      .populate("companyId", "name email")
      .populate("tripId");

    if (!payment) {
      return res
        .status(404)
        .json({ ok: false, error: "Payment not found for your company" });
    }

    res.json({ ok: true, payment });
  } catch (err) {
    console.error("❌ getManagerPaymentDetails error:", err);
    res.status(500).json({ ok: false, error: "Error loading payment details" });
  }
};

/* ==========================================================
   📊 SUMMARY (PAID ONLY)
========================================================== */
export const getManagerPaymentsSummary = async (req, res) => {
  try {
    const companyId = resolveCompanyIdFromUser(req.user);

    if (!companyId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve companyId for summary.",
      });
    }

    const { dateFrom, dateTo } = req.query;

    const match = { companyId, status: "paid" };

    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const [summary] = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalCompanyEarning: { $sum: "$companyEarning" },
          totalDriverEarning: { $sum: "$driverEarning" },
          totalPlatformEarning: { $sum: "$platformEarning" },
          refundedCount: { $sum: 0 }, // ensures frontend always has this field
        },
      },
    ]);

    res.json({
      ok: true,
      summary: summary || {
        totalPayments: 0,
        totalAmount: 0,
        totalCompanyEarning: 0,
        totalDriverEarning: 0,
        totalPlatformEarning: 0,
        refundedCount: 0,
      },
    });
  } catch (err) {
    console.error("❌ getManagerPaymentsSummary error:", err);
    res.status(500).json({ ok: false, error: "Error loading summary" });
  }
};
