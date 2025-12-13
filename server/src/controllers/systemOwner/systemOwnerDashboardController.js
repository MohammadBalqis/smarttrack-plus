// server/src/controllers/systemOwner/systemOwnerDashboardController.js
import User from "../../models/User.js";
import Trip from "../../models/Trip.js";
import Payment from "../../models/Payment.js";
import Company from "../../models/Company.js";

/* ==========================================================
   🔧 Helper — subscription tier from driver count
   Tiers (per company, per month):
   - 0–10   drivers → $50
   - 11–30  drivers → $80
   - 31–50  drivers → $100
   - 51+    drivers → $150
========================================================== */
const getSubscriptionFromDrivers = (driverCount = 0) => {
  let planLabel = "Free";
  let maxDrivers = 10;
  let price = 0;

  if (driverCount <= 10) {
    planLabel = "Starter";
    maxDrivers = 10;
    price = 50;
  } else if (driverCount <= 30) {
    planLabel = "Growth";
    maxDrivers = 30;
    price = 80;
  } else if (driverCount <= 50) {
    planLabel = "Scale";
    maxDrivers = 50;
    price = 100;
  } else {
    planLabel = "Enterprise";
    maxDrivers = 9999; // “unlimited” in UI
    price = 150;
  }

  return { planLabel, maxDrivers, price };
};

/* ==========================================================
   SO.1 — GET OVERVIEW (KPIs)
   GET /api/owner/overview
========================================================== */
export const getOwnerOverview = async (req, res) => {
  try {
    // Use Company model for tenants
    const totalCompanies = await Company.countDocuments({ isActive: true });

    const totalManagers = await User.countDocuments({ role: "manager" });
    const totalDrivers = await User.countDocuments({ role: "driver" });
    const totalCustomers = await User.countDocuments({ role: "customer" });

    const totalTrips = await Trip.countDocuments();

    // Trips today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tripsToday = await Trip.countDocuments({
      createdAt: { $gte: startOfDay },
    });

    // Revenue today
    const paymentsToday = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          status: "paid",
        },
      },
      {
        $group: { _id: null, total: { $sum: "$amount" } },
      },
    ]);

    const revenueToday = paymentsToday[0]?.total || 0;

    return res.json({
      ok: true,
      totalCompanies,
      totalManagers,
      totalDrivers,
      totalCustomers,
      totalTrips,
      tripsToday,
      revenueToday,
    });
  } catch (err) {
    console.error("Owner overview error:", err);
    res
      .status(500)
      .json({ ok: false, error: "Server error loading owner overview." });
  }
};

/* ==========================================================
   SO.1 — COMPANIES ACTIVITY TABLE
   GET /api/owner/companies-activity
   Used by SystemOwnerDashboard table
========================================================== */
export const getCompaniesActivity = async (req, res) => {
  try {
    const companies = await Company.find({})
      .select("_id name createdAt billingStatus isActive");

    if (!companies.length) {
      return res.json({ ok: true, companies: [] });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const formatted = await Promise.all(
      companies.map(async (company) => {
        const companyId = company._id;

        // Total drivers for this company
        const totalDrivers = await User.countDocuments({
          role: "driver",
          companyId,
        });

        // Active drivers now (online)
        const activeDrivers = await User.countDocuments({
          role: "driver",
          companyId,
          isOnline: true,
        });

        // Subscription from drivers
        const { planLabel, maxDrivers, price } =
          getSubscriptionFromDrivers(totalDrivers);

        // Trips today
        const tripsToday = await Trip.countDocuments({
          companyId,
          createdAt: { $gte: startOfDay },
        });

        // Revenue today from this company
        const revenueTodayAgg = await Payment.aggregate([
          {
            $match: {
              companyId,
              createdAt: { $gte: startOfDay },
              status: "paid",
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        const revenueToday = revenueTodayAgg[0]?.total || 0;

        // Billing/Status
        const isPastDue = company.billingStatus === "unpaid";
        const status =
          company.billingStatus === "suspended" || company.isActive === false
            ? "Suspended"
            : "Active";

        return {
          companyId,
          name: company.name,
          totalDrivers,
          activeDrivers,
          subscriptionPlan: planLabel,
          subscriptionPrice: price,
          maxDrivers,
          tripsToday,
          totalRevenue: revenueToday,
          isPastDue,
          status,
          createdAt: company.createdAt,
        };
      })
    );

    return res.json({ ok: true, companies: formatted });
  } catch (err) {
    console.error("Companies activity error:", err);
    res
      .status(500)
      .json({ ok: false, error: "Server error loading company activity." });
  }
};

/* ==========================================================
   SO.1 — REVENUE CHART (LAST 14 DAYS)
   GET /api/owner/revenue-chart
========================================================== */
export const getRevenueChart = async (req, res) => {
  try {
    const days = 14;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "paid",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    const formatted = data.map((d) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, "0")}-${String(
        d._id.day
      ).padStart(2, "0")}`,
      total: d.total,
    }));

    return res.json({ ok: true, chart: formatted });
  } catch (err) {
    console.error("Revenue chart error:", err);
    res
      .status(500)
      .json({ ok: false, error: "Server error loading chart." });
  }
};
export const getCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await User.findOne({ _id: companyId, role: "company" });

    if (!company)
      return res.status(404).json({ error: "Company not found" });

    const totalDrivers = await User.countDocuments({ role: "driver", companyId });
    const activeDrivers = await User.countDocuments({
      role: "driver",
      companyId,
      driverStatus: "available"
    });

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const tripsToday = await Trip.countDocuments({
      companyId,
      createdAt: { $gte: start }
    });

    const revenueAgg = await Payment.aggregate([
      { $match: { companyId, createdAt: { $gte: start }, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const revenueToday = revenueAgg[0]?.total || 0;

    return res.json({
      ok: true,
      company: {
        ...company.toObject(),
        totalDrivers,
        activeDrivers,
        tripsToday,
        revenueToday
      }
    });
  } catch (err) {
    console.error("Company details error:", err);
    res.status(500).json({ error: "Server error loading company details" });
  }
};
