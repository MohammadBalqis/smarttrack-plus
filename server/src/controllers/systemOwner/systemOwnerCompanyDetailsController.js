import Company from "../../models/Company.js";
import User from "../../models/User.js";
import Trip from "../../models/Trip.js";
import Payment from "../../models/Payment.js";

/* ==========================================================
   SO.1.A9 — GET COMPANY DETAILS
   GET /api/owner/company/:companyId
========================================================== */
export const getCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId).lean();
    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    // Counts
    const managersCount = await User.countDocuments({
      role: "manager",
      companyId,
    });

    const driversCount = await User.countDocuments({
      role: "driver",
      companyId,
    });

    const activeDrivers = await User.countDocuments({
      role: "driver",
      companyId,
      isOnline: true,
    });

    const totalTrips = await Trip.countDocuments({ companyId });

    const totalRevenueAgg = await Payment.aggregate([
      { $match: { companyId, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    return res.json({
      ok: true,
      company: {
        ...company,
        managersCount,
        driversCount,
        activeDrivers,
        totalTrips,
        totalRevenue,
      },
    });
  } catch (err) {
    console.error("getCompanyDetails error:", err);
    res.status(500).json({
      ok: false,
      error: "Server error loading company details",
    });
  }
};
