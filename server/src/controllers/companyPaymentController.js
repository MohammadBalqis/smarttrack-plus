// server/src/controllers/companyPaymentController.js
import Payment from "../models/Payment.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";

/* ==========================================================
   Helper: resolve companyId
========================================================== */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) {
    return user.companyId;
  }
  return null;
};

/* ==========================================================
   GET /api/company/payments
   📌 List all payments for company (with filters)
========================================================== */
export const getCompanyPayments = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const {
      status,
      method,
      driverId,
      customerId,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { companyId };

    if (status) query.status = status;
    if (method) query.method = method;
    if (driverId) query.driverId = driverId;
    if (customerId) query.customerId = customerId;

    // Date filter
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("tripId", "pickupAddress dropoffAddress distanceKm")
        .populate("driverId", "name phone profileImage")
        .populate("customerId", "name email phone")
        .lean(),
      Payment.countDocuments(query),
    ]);

    // Calculate summary
    const summary = payments.reduce(
      (acc, p) => {
        acc.totalPaid += p.totalAmount || 0;
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      { totalPaid: 0, paid: 0, pending: 0, failed: 0, refunded: 0 }
    );

    res.json({
      ok: true,
      payments,
      total,
      page: pageNum,
      limit: limitNum,
      summary,
    });
  } catch (err) {
    console.error("❌ getCompanyPayments error:", err.message);
    res.status(500).json({ error: "Server error fetching payments" });
  }
};

/* ==========================================================
   GET /api/company/payments/:id
   📌 Single payment details
========================================================== */
export const getCompanyPaymentDetails = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const { id } = req.params;

    const payment = await Payment.findOne({ _id: id, companyId })
      .populate("tripId")
      .populate("driverId", "name email phone")
      .populate("customerId", "name email phone")
      .lean();

    if (!payment) return res.status(404).json({ error: "Payment not found" });

    res.json({
      ok: true,
      payment,
    });
  } catch (err) {
    console.error("❌ getCompanyPaymentDetails error:", err.message);
    res.status(500).json({ error: "Server error fetching payment details" });
  }
};

/* ==========================================================
   GET /api/company/payments/stats
   📊 Dashboard summary for cards
========================================================== */
export const getCompanyPaymentsStats = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const payments = await Payment.find({ companyId }).lean();

    const totalPayments = payments.length;
    const paidCount = payments.filter((p) => p.status === "paid").length;
    const pendingCount = payments.filter((p) => p.status === "pending").length;
    const failedCount = payments.filter((p) => p.status === "failed").length;

    const totalRevenue = payments.reduce(
      (sum, p) => sum + (p.companyEarning || 0),
      0
    );

    res.json({
      ok: true,
      stats: {
        totalPayments,
        paidCount,
        pendingCount,
        failedCount,
        totalRevenue,
      },
    });
  } catch (err) {
    console.error("❌ getCompanyPaymentsStats error:", err.message);
    res.status(500).json({ error: "Server error fetching payment stats" });
  }
};
