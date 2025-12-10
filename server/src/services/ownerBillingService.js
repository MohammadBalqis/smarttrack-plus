// server/src/services/ownerBillingService.js
import Company from "../models/Company.js";
import User from "../models/User.js";
import OwnerInvoice from "../models/OwnerInvoice.js";
import { getSubscriptionTierFromDrivers } from "../utils/subscriptionUtils.js";

/**
 * Helper to get start & end of current month.
 */
const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

/**
 * Run recurring monthly billing for ALL active companies.
 * - Calculates driver count per company
 * - Maps to a tier (0-10, 11-30, ...)
 * - Creates an OwnerInvoice if it's time
 * - Updates company.subscription snapshot
 */
export const runMonthlyBillingCycle = async () => {
  const { start: periodStart, end: periodEnd } = getCurrentMonthRange();
  const today = new Date();

  // 1) Fetch all active companies
  const companies = await Company.find({ isActive: true });

  const results = [];

  for (const company of companies) {
    const companyId = company._id;

    // 2) Count drivers for this company
    const driverCount = await User.countDocuments({
      role: "driver",
      companyId,
    });

    // 3) Determine tier & price from driver count
    const tierInfo = getSubscriptionTierFromDrivers(driverCount);

    // 4) Check if this company already has an invoice for this period
    const existingInvoice = await OwnerInvoice.findOne({
      companyId,
      periodStart,
      periodEnd,
    });

    if (existingInvoice) {
      // Optionally: update status / driver snapshot if driver count changed
      results.push({
        companyId,
        companyName: company.name,
        action: "skipped_existing_invoice",
        invoiceId: existingInvoice._id,
      });
      continue;
    }

    // 5) Create new invoice
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 7); // 7 days after month-end

    const invoice = await OwnerInvoice.create({
      companyId,
      periodStart,
      periodEnd,
      driverCountSnapshot: driverCount,
      tierKey: tierInfo.tierKey,
      tierLabel: tierInfo.label,
      maxDrivers: tierInfo.maxDrivers,
      amountUsd: tierInfo.priceUsd,
      status: "pending",
      dueDate,
      notes: `Monthly subscription for ${tierInfo.label}`,
    });

    // 6) Update company subscription snapshot
    company.subscription = {
      ...company.subscription,
      tierKey: tierInfo.tierKey,
      label: tierInfo.label,
      maxDrivers: tierInfo.maxDrivers,
      priceUsd: tierInfo.priceUsd,
      lastDriverCount: driverCount,
      billingPeriod: "monthly",
      nextBillingDate: new Date(
        periodEnd.getFullYear(),
        periodEnd.getMonth() + 1,
        1,
        0,
        0,
        0,
        0
      ),
      lastBilledAt: today,
      isPastDue: false,
      lastInvoiceId: invoice._id,
    };

    company.billingStatus = "unpaid"; // until invoice becomes "paid"
    await company.save();

    results.push({
      companyId,
      companyName: company.name,
      action: "invoice_created",
      invoiceId: invoice._id,
      amountUsd: tierInfo.priceUsd,
      driverCount,
    });
  }

  return results;
};

/**
 * Mark overdue invoices as past due.
 * (You can run this daily via cron)
 */
export const markPastDueInvoices = async () => {
  const today = new Date();

  const invoices = await OwnerInvoice.find({
    status: "pending",
    dueDate: { $lt: today },
  });

  for (const invoice of invoices) {
    invoice.status = "past_due";
    await invoice.save();

    // Also flag company as past due
    const company = await Company.findById(invoice.companyId);
    if (company) {
      company.subscription = {
        ...company.subscription,
        isPastDue: true,
      };
      company.billingStatus = "unpaid";
      await company.save();
    }
  }

  return invoices.length;
};
