import User from "../../models/User.js";
import Trip from "../../models/Trip.js";
import Payment from "../../models/Payment.js";
import Company from "../../models/Company.js";

/* ==========================================================
   GET OWNER OVERVIEW
========================================================== */
export const getOwnerOverview = async (req, res) => {
  try {
    const [
      totalCompanies,
      totalManagers,
      totalDrivers,
      totalCustomers,
      totalTrips,
    ] = await Promise.all([
      Company.countDocuments({ isActive: true }),
      User.countDocuments({ role: "manager" }),
      User.countDocuments({ role: "driver" }),
      User.countDocuments({ role: "customer" }),
      Trip.countDocuments(),
    ]);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const tripsToday = await Trip.countDocuments({
      createdAt: { $gte: start },
    });

    const revenueAgg = await Payment.aggregate([
      { $match: { createdAt: { $gte: start }, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      ok: true,
      totalCompanies,
      totalManagers,
      totalDrivers,
      totalCustomers,
      totalTrips,
      tripsToday,
      revenueToday: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    console.error("getOwnerOverview error:", err);
    res.status(500).json({ ok: false, error: "Dashboard error" });
  }
};

/* ==========================================================
   COMPANIES ACTIVITY TABLE ✅ FINAL FIX
========================================================== */
export const getCompaniesActivity = async (req, res) => {
  try {
    // ✅ keep soft-deleted companies visible but controlled by status
    const companies = await Company.find().lean();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const companiesData = await Promise.all(
      companies.map(async (company) => {
        const companyId = company._id;

        const [totalDrivers, activeDrivers, tripsToday] = await Promise.all([
          User.countDocuments({ role: "driver", companyId }),
          User.countDocuments({
            role: "driver",
            companyId,
            isOnline: true,
          }),
          Trip.countDocuments({
            companyId,
            createdAt: { $gte: start },
          }),
        ]);

        return {
          companyId,
          name: company.name,
          createdAt: company.createdAt,

          // 🔥 SOURCE OF TRUTH
          subscriptionPlan: company.subscription?.label || "—",
          maxDrivers: company.subscription?.maxDrivers ?? "—",

          activeDrivers,
          tripsToday,

          status:
            !company.isActive || company.billingStatus === "suspended"
              ? "Suspended"
              : "Active",
        };
      })
    );

    res.json({ ok: true, companies: companiesData });
  } catch (err) {
    console.error("getCompaniesActivity error:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to load companies activity",
    });
  }
};

/* ==========================================================
   REVENUE CHART
========================================================== */
export const getRevenueChart = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 14);

    const chart = await Payment.aggregate([
      { $match: { status: "paid", createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ ok: true, chart });
  } catch (err) {
    console.error("getRevenueChart error:", err);
    res.status(500).json({ ok: false });
  }
};
