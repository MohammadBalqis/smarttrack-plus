import Company from "../../models/Company.js";
import User from "../../models/User.js";
import Trip from "../../models/Trip.js";
import Payment from "../../models/Payment.js";

/* ==========================================================
   SUBSCRIPTION TIERS — SINGLE SOURCE OF TRUTH
========================================================== */
const SUBSCRIPTIONS = {
  drivers_0_10: {
    tierKey: "drivers_0_10",
    label: "0–10 drivers",
    maxDrivers: 10,
    priceUsd: 50,
    plan: "starter",
  },
  drivers_11_30: {
    tierKey: "drivers_11_30",
    label: "11–30 drivers",
    maxDrivers: 30,
    priceUsd: 80,
    plan: "growth",
  },
  drivers_31_50: {
    tierKey: "drivers_31_50",
    label: "31–50 drivers",
    maxDrivers: 50,
    priceUsd: 100,
    plan: "pro",
  },
  drivers_51_plus: {
    tierKey: "drivers_51_plus",
    label: "51+ drivers",
    maxDrivers: 9999,
    priceUsd: 150,
    plan: "enterprise",
  },
};

/* ==========================================================
   GET COMPANY DETAILS
========================================================== */
export const getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId).lean();
    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [totalDrivers, activeDrivers, tripsToday, revenueAgg] =
      await Promise.all([
        User.countDocuments({ role: "driver", companyId: company._id }),
        User.countDocuments({
          role: "driver",
          companyId: company._id,
          isOnline: true,
        }),
        Trip.countDocuments({
          companyId: company._id,
          createdAt: { $gte: start },
        }),
        Payment.aggregate([
          { $match: { companyId: company._id, status: "paid" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

    res.json({
      ok: true,
      company: {
        id: company._id,
        name: company.name,
        createdAt: company.createdAt,
        subscriptionPlan: company.subscription?.label || "—",
        subscriptionPrice: company.subscription?.priceUsd || 0,
        maxDrivers: company.subscription?.maxDrivers || 0,
        totalDrivers,
        activeDrivers,
        tripsToday,
        totalRevenue: revenueAgg[0]?.total || 0,
        status:
          !company.isActive || company.billingStatus === "suspended"
            ? "Suspended"
            : "Active",
      },
    });
  } catch (err) {
    console.error("getCompanyDetails error:", err);
    res.status(500).json({ ok: false });
  }
};

/* ==========================================================
   UPDATE SUBSCRIPTION
========================================================== */
export const updateCompanySubscription = async (req, res) => {
  try {
    const { tierKey } = req.body;
    const tier = SUBSCRIPTIONS[tierKey];

    if (!tier) {
      return res.status(400).json({
        ok: false,
        error: "Invalid subscription tier",
      });
    }

    await Company.findByIdAndUpdate(req.params.companyId, {
      plan: tier.plan,
      subscription: {
        tierKey: tier.tierKey,
        label: tier.label,
        maxDrivers: tier.maxDrivers,
        priceUsd: tier.priceUsd,
        isPastDue: false,
      },
      billingStatus: "active",
      isActive: true,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("updateCompanySubscription error:", err);
    res.status(500).json({ ok: false });
  }
};

/* ==========================================================
   UPDATE STATUS (ACTIVE / SUSPENDED)
========================================================== */
export const updateCompanyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid status value",
      });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.companyId,
      {
        isActive: status === "active",
        billingStatus: status,
      },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("updateCompanyStatus error:", err);
    res.status(500).json({ ok: false });
  }
};

/* ==========================================================
   UPDATE LIMITS
========================================================== */
export const updateCompanyLimits = async (req, res) => {
  try {
    const { maxDrivers } = req.body;

    await Company.findByIdAndUpdate(req.params.companyId, {
      "subscription.maxDrivers": maxDrivers,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("updateCompanyLimits error:", err);
    res.status(500).json({ ok: false });
  }
};

/* ==========================================================
   SUSPEND COMPANY (SOFT DELETE)
========================================================== */
export const deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndUpdate(req.params.companyId, {
      isActive: false,
      billingStatus: "suspended",
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("deleteCompany error:", err);
    res.status(500).json({ ok: false });
  }
};

/* ==========================================================
   🔥 PERMANENT DELETE COMPANY (HARD DELETE)
========================================================== */
export const permanentlyDeleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    // 1️⃣ Delete drivers & managers
    await User.deleteMany({
      companyId,
      role: { $in: ["driver", "manager"] },
    });

    // 2️⃣ Delete company owner
    await User.deleteOne({
      _id: company.ownerId,
    });

    // 3️⃣ Delete trips
    await Trip.deleteMany({ companyId });

    // 4️⃣ Delete payments
    await Payment.deleteMany({ companyId });

    // 5️⃣ Delete company
    await Company.deleteOne({ _id: companyId });

    return res.json({
      ok: true,
      message: "Company permanently deleted",
    });
  } catch (err) {
    console.error("permanentlyDeleteCompany error:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to permanently delete company",
    });
  }
};
