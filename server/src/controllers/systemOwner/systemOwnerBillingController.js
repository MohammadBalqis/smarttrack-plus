// server/src/controllers/systemOwner/systemOwnerBillingController.js
import User from "../../models/User.js";
import SubscriptionInvoice from "../../models/SubscriptionInvoice.js";

/* ==========================================================
   Helper — subscription tier from driver count
   0–10  => $50
   11–30 => $80
   31–50 => $100
   51+   => $150
========================================================== */
export const getSubscriptionTierForDrivers = (driverCount) => {
  if (driverCount <= 10) {
    return {
      tierKey: "tier_0_10",
      label: "0–10 drivers",
      maxDrivers: 10,
      priceUsd: 50,
    };
  }
  if (driverCount <= 30) {
    return {
      tierKey: "tier_11_30",
      label: "11–30 drivers",
      maxDrivers: 30,
      priceUsd: 80,
    };
  }
  if (driverCount <= 50) {
    return {
      tierKey: "tier_31_50",
      label: "31–50 drivers",
      maxDrivers: 50,
      priceUsd: 100,
    };
  }
  return {
    tierKey: "tier_51_plus",
    label: "51+ drivers",
    maxDrivers: 9999,
    priceUsd: 150,
  };
};

/* ==========================================================
   SO.4 — BILLING OVERVIEW
   GET /api/owner/billing/overview
   - totalInvoices
   - totalMRR (estimated from current driver counts)
   - pendingInvoices
   - overdueInvoices
========================================================== */
export const getOwnerBillingOverview = async (req, res) => {
  try {
    // 1) Invoices stats
    const [totalInvoices, pendingInvoices, overdueInvoices] =
      await Promise.all([
        SubscriptionInvoice.countDocuments(),
        SubscriptionInvoice.countDocuments({ status: "pending" }),
        SubscriptionInvoice.countDocuments({ status: "overdue" }),
      ]);

    // 2) Estimate current MRR from live driver counts
    const companies = await User.find({ role: "company" }).select("_id name");

    let estimatedMRR = 0;

    for (const company of companies) {
      const driverCount = await User.countDocuments({
        role: "driver",
        companyId: company._id,
      });

      const { priceUsd } = getSubscriptionTierForDrivers(driverCount);
      estimatedMRR += priceUsd;
    }

    return res.json({
      ok: true,
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      estimatedMRR,
    });
  } catch (err) {
    console.error("getOwnerBillingOverview error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error loading billing overview." });
  }
};

/* ==========================================================
   SO.4 — INVOICES LIST
   GET /api/owner/billing/invoices
   Query:
     - status    (optional) pending|paid|overdue|cancelled
     - companyId (optional)
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

    return res.json({
      ok: true,
      invoices,
    });
  } catch (err) {
    console.error("getOwnerInvoices error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error loading invoices." });
  }
};

/* ==========================================================
   (Optional) — GENERATE SINGLE COMPANY INVOICE
   POST /api/owner/billing/invoices/generate/:companyId
========================================================== */
export const generateCompanyInvoice = async (req, res) => {
  try {
    const { companyId } = req.params;

    // 1) Count drivers for this company
    const driverCount = await User.countDocuments({
      role: "driver",
      companyId,
    });

    const { tierKey, label, priceUsd } =
      getSubscriptionTierForDrivers(driverCount);

    // 2) Build current monthly period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Due date: 7 days after month end
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 7);

    // 3) Create invoice
    const invoice = await SubscriptionInvoice.create({
      companyId,
      periodStart,
      periodEnd,
      driverCount,
      tierKey,
      tierLabel: label,
      amount: priceUsd,
      currency: "USD",
      status: "pending",
      dueDate,
    });

    return res.json({ ok: true, invoice });
  } catch (err) {
    console.error("generateCompanyInvoice error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error generating invoice." });
  }
};
