// server/src/controllers/systemOwner/systemOwnerCompanyController.js
import User from "../../models/User.js";
import Trip from "../../models/Trip.js";
import Payment from "../../models/Payment.js";
import CompanySettings from "../../models/Company.js";
import Company from "../../models/Company.js";

/* ==========================================================
   Helper — subscription from driver count
   ----------------------------------------------------------
   0–10  drivers  -> 50$
   11–30 drivers  -> 80$
   31–50 drivers  -> 100$
   >50   drivers  -> 150$
========================================================== */
const getSubscriptionFromDrivers = (driverCount = 0) => {
  let tierLabel = "0–10 drivers";
  let monthlyPrice = 50;
  let plan = "starter";

  if (driverCount <= 10) {
    tierLabel = "0–10 drivers";
    monthlyPrice = 50;
    plan = "starter";
  } else if (driverCount <= 30) {
    tierLabel = "11–30 drivers";
    monthlyPrice = 80;
    plan = "growth";
  } else if (driverCount <= 50) {
    tierLabel = "31–50 drivers";
    monthlyPrice = 100;
    plan = "pro";
  } else {
    tierLabel = "50+ drivers";
    monthlyPrice = 150;
    plan = "enterprise";
  }

  return { plan, tierLabel, monthlyPrice };
};

/* Small helper to ensure a Company config doc exists */
const ensureCompanyConfig = async (companyUser) => {
  if (!companyUser) return null;

  let config = await Company.findOne({ ownerId: companyUser._id });

  if (!config) {
    config = new Company({
      name: companyUser.name,
      email: companyUser.email,
      phone: companyUser.phone,
      address: companyUser.address || "",
      ownerId: companyUser._id,
      // defaults from schema: plan="free", billingStatus="active"
    });
    await config.save();
  }

  return config;
};

/* ==========================================================
   SO.3.1 — GET COMPANY DETAILS
   GET /api/owner/companies/:companyId
========================================================== */
export const getCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;

    // 1) Base company user
    const companyUser = await User.findOne({
      _id: companyId,
      role: "company",
    });

    if (!companyUser) {
      return res.status(404).json({
        ok: false,
        error: "Company not found.",
      });
    }

    // 2) Stats
    const [driverCount, managerCount, totalTrips] = await Promise.all([
      User.countDocuments({ role: "driver", companyId }),
      User.countDocuments({ role: "manager", companyId }),
      Trip.countDocuments({ companyId }),
    ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const tripsToday = await Trip.countDocuments({
      companyId,
      createdAt: { $gte: startOfToday },
    });

    // Revenue totals
    const paymentsAgg = await Payment.aggregate([
      { $match: { companyId, status: "paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    const paymentsTodayAgg = await Payment.aggregate([
      {
        $match: {
          companyId,
          status: "paid",
          createdAt: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    const totalRevenue = paymentsAgg[0]?.totalRevenue || 0;
    const revenueToday = paymentsTodayAgg[0]?.totalRevenue || 0;

    // 3) Settings & limits
    const settingsDoc = await CompanySettings.findOne({ companyId });

    // 4) Subscription from drivers + company config doc
    const subscriptionFromDrivers = getSubscriptionFromDrivers(driverCount);
    const companyConfig = await ensureCompanyConfig(companyUser);

    const subscription = {
      plan: companyConfig?.plan || subscriptionFromDrivers.plan,
      tierLabel: subscriptionFromDrivers.tierLabel,
      monthlyPrice: subscriptionFromDrivers.monthlyPrice,
      billingStatus: companyConfig?.billingStatus || "active",
    };

    // 5) Response
    return res.json({
      ok: true,
      company: {
        id: companyUser._id,
        name: companyUser.name,
        email: companyUser.email,
        phone: companyUser.phone,
        address: companyUser.address || "",
        isSuspended: !!companyUser.isSuspended,
        createdAt: companyUser.createdAt,
      },
      subscription,
      limits: {
        maxDrivers: settingsDoc?.maxDrivers || null,
        maxManagers: settingsDoc?.maxManagers || null,
        maxVehicles: settingsDoc?.maxVehicles || null,
        maxShops: settingsDoc?.maxShops || null,
      },
      stats: {
        driverCount,
        managerCount,
        totalTrips,
        tripsToday,
        totalRevenue,
        revenueToday,
      },
    });
  } catch (err) {
    console.error("getCompanyDetails error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error loading company details." });
  }
};

/* ==========================================================
   SO.3.2 — UPDATE COMPANY SUBSCRIPTION
   PATCH /api/owner/companies/:companyId/subscription
   Body:
     - plan?          ("starter" | "growth" | "pro" | "enterprise")
     - billingStatus? ("active" | "unpaid" | "suspended")
========================================================== */
export const updateCompanySubscription = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { plan, billingStatus } = req.body;

    const companyUser = await User.findOne({
      _id: companyId,
      role: "company",
    });

    if (!companyUser) {
      return res.status(404).json({
        ok: false,
        error: "Company not found.",
      });
    }

    const config = await ensureCompanyConfig(companyUser);

    if (plan) {
      config.plan = plan;
    }
    if (billingStatus) {
      config.billingStatus = billingStatus;
    }

    await config.save();

    return res.json({
      ok: true,
      message: "Subscription updated.",
      company: {
        id: companyUser._id,
        name: companyUser.name,
      },
      subscription: {
        plan: config.plan,
        billingStatus: config.billingStatus,
      },
    });
  } catch (err) {
    console.error("updateCompanySubscription error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error updating subscription." });
  }
};

/* ==========================================================
   SO.3.3 — UPDATE COMPANY STATUS (ACTIVE / SUSPENDED)
   PATCH /api/owner/companies/:companyId/status
   Body:
     - status: "active" | "suspended"
========================================================== */
export const updateCompanyStatus = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid status. Use 'active' or 'suspended'.",
      });
    }

    const companyUser = await User.findOne({
      _id: companyId,
      role: "company",
    });

    if (!companyUser) {
      return res.status(404).json({
        ok: false,
        error: "Company not found.",
      });
    }

    companyUser.isSuspended = status === "suspended";
    if (status === "suspended") {
      companyUser.isActive = false;
    }
    await companyUser.save();

    // Optional: align billingStatus on Company config
    const config = await Company.findOne({ ownerId: companyId });
    if (config) {
      if (status === "suspended") {
        config.billingStatus = "suspended";
      } else if (config.billingStatus === "suspended") {
        // bring back to active if owner re-activates
        config.billingStatus = "active";
      }
      await config.save();
    }

    return res.json({
      ok: true,
      message: "Company status updated.",
      company: {
        id: companyUser._id,
        isSuspended: companyUser.isSuspended,
      },
    });
  } catch (err) {
    console.error("updateCompanyStatus error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error updating status." });
  }
};

/* ==========================================================
   SO.3.4 — UPDATE COMPANY LIMITS (drivers / managers / vehicles)
   PATCH /api/owner/companies/:companyId/limits
   Body (all optional):
     - maxDrivers
     - maxManagers
     - maxVehicles
     - maxShops
========================================================== */
export const updateCompanyLimits = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { maxDrivers, maxManagers, maxVehicles, maxShops } = req.body;

    const companyUser = await User.findOne({
      _id: companyId,
      role: "company",
    });

    if (!companyUser) {
      return res.status(404).json({
        ok: false,
        error: "Company not found.",
      });
    }

    const update = {};
    if (maxDrivers !== undefined) update.maxDrivers = maxDrivers;
    if (maxManagers !== undefined) update.maxManagers = maxManagers;
    if (maxVehicles !== undefined) update.maxVehicles = maxVehicles;
    if (maxShops !== undefined) update.maxShops = maxShops;

    const settings = await CompanySettings.findOneAndUpdate(
      { companyId },
      { $set: update },
      { new: true, upsert: true }
    );

    return res.json({
      ok: true,
      message: "Company limits updated.",
      limits: {
        maxDrivers: settings.maxDrivers || null,
        maxManagers: settings.maxManagers || null,
        maxVehicles: settings.maxVehicles || null,
        maxShops: settings.maxShops || null,
      },
    });
  } catch (err) {
    console.error("updateCompanyLimits error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error updating limits." });
  }
};

/* ==========================================================
   SO.3.5 — DELETE / DEACTIVATE COMPANY
   DELETE /api/owner/companies/:companyId
   NOTE: this is a SOFT delete (flags), not hard delete.
========================================================== */
export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const companyUser = await User.findOne({
      _id: companyId,
      role: "company",
    });

    if (!companyUser) {
      return res.status(404).json({
        ok: false,
        error: "Company not found.",
      });
    }

    // Soft delete: mark inactive + suspended
    companyUser.isActive = false;
    companyUser.isSuspended = true;
    companyUser.deletedAt = new Date();
    await companyUser.save();

    // Optional: mark company config as suspended / unpaid
    const config = await Company.findOne({ ownerId: companyId });
    if (config) {
      config.billingStatus = "suspended";
      await config.save();
    }

    return res.json({
      ok: true,
      message:
        "Company has been deactivated (soft delete). You can keep data for reports.",
    });
  } catch (err) {
    console.error("deleteCompany error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error deleting company." });
  }
};
