import Company from "../../models/Company.js";
import User from "../../models/User.js";
import SubscriptionInvoice from "../../models/SubscriptionInvoice.js";

/* ==========================================================
   SO.4 — BILLING OVERVIEW (FIXED)
========================================================== */
export const getOwnerBillingOverview = async (req, res) => {
  try {
    const [totalInvoices, pendingInvoices, overdueInvoices] =
      await Promise.all([
        SubscriptionInvoice.countDocuments(),
        SubscriptionInvoice.countDocuments({ status: "pending" }),
        SubscriptionInvoice.countDocuments({ status: "overdue" }),
      ]);

    // 🔥 ONLY ACTIVE COMPANIES WITH SUBSCRIPTIONS
    const companies = await Company.find({
      billingStatus: "active",
      "subscription.priceUsd": { $exists: true },
    }).select("subscription");

    const estimatedMRR = companies.reduce(
      (sum, c) => sum + (c.subscription?.priceUsd || 0),
      0
    );

    return res.json({
      ok: true,
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      estimatedMRR,
    });
  } catch (err) {
    console.error("getOwnerBillingOverview error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error loading billing overview.",
    });
  }
};

/* ==========================================================
   SO.4 — INVOICES LIST (UNCHANGED)
========================================================== */
export const getOwnerInvoices = async (req, res) => {
  try {
    const { status, companyId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (companyId) filter.companyId = companyId;

    const invoices = await SubscriptionInvoice.find(filter)
      .populate("companyId", "name email")
      .sort({ createdAt: -1 });

    return res.json({ ok: true, invoices });
  } catch (err) {
    console.error("getOwnerInvoices error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error loading invoices.",
    });
  }
};

/* ==========================================================
   GENERATE INVOICE (FIXED — CONTRACT BASED)
========================================================== */
export const generateCompanyInvoice = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company || !company.subscription) {
      return res.status(400).json({
        ok: false,
        error: "Company has no active subscription",
      });
    }

    const driverCount = await User.countDocuments({
      role: "driver",
      companyId,
    });

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 7);

    const invoice = await SubscriptionInvoice.create({
      companyId,
      periodStart,
      periodEnd,
      driverCount,

      tierKey: company.subscription.tierKey,
      tierLabel: company.subscription.label,
      amount: company.subscription.priceUsd,

      currency: "USD",
      status: "pending",
      dueDate,
    });

    return res.json({ ok: true, invoice });
  } catch (err) {
    console.error("generateCompanyInvoice error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error generating invoice.",
    });
  }
};
