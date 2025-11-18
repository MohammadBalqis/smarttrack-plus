// server/src/routes/billingSettingsRoutes.js
import { Router } from "express";
import BillingSettings from "../models/BillingSettings.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { logActivity } from "../utils/activityLogger.js";

const router = Router();

/* ==========================================================
   Helper: get or create company billing settings
   ========================================================== */
const getOrCreateCompanySettings = async (companyId) => {
  let settings = await BillingSettings.findOne({
    scope: "company",
    companyId,
  });

  if (!settings) {
    settings = await BillingSettings.create({
      scope: "company",
      companyId,
    });
  }

  return settings;
};

/* ==========================================================
   🔹 1. SUPERADMIN — Get global billing settings
   GET /api/billing-settings/global
   ========================================================== */
router.get(
  "/global",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      let settings = await BillingSettings.findOne({
        scope: "global",
        companyId: null,
      });

      if (!settings) {
        settings = await BillingSettings.create({
          scope: "global",
          companyId: null,
        });
      }

      res.json({ ok: true, settings });
    } catch (err) {
      console.error("❌ Get global billing settings error:", err.message);
      res
        .status(500)
        .json({ error: "Server error loading global billing settings" });
    }
  }
);

/* ==========================================================
   🔹 2. SUPERADMIN — Update global billing settings
   PUT /api/billing-settings/global
   ========================================================== */
router.put(
  "/global",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const allowedFields = [
        "currency",
        "taxRate",
        "includeTax",
        "billingCycle",
        "invoicePrefix",

        "baseFee",
        "perKmFee",
        "minFee",
        "maxFee",
        "freeDeliveryThreshold",
        "surgePricingEnabled",
        "surgeMultiplier",

        "driverCommissionType",
        "driverCommissionValue",
        "driverReceiveDeliveryFee",
        "driverSalaryMode",
        "monthlySalaryAmount",

        "wishMoneyEnabled",
        "wishMoneyMerchantId",
        "wishMoneyKey",
        "wishMoneyCallbackUrl",

        "discountsEnabled",
        "maxDiscountPercent",
        "promoCodesEnabled",
        "promoCodes",

        "companyCommissionType",
        "companyCommissionValue",
        "companyShareOfDeliveryFee",

        "autoInvoiceCompanyEnabled",
        "autoInvoiceCustomerEnabled",
        "invoiceFooterNote",
        "signatureImage",
        "isActive",
      ];

      const update = {};
      Object.keys(req.body || {}).forEach((key) => {
        if (allowedFields.includes(key)) {
          update[key] = req.body[key];
        }
      });

      let settings = await BillingSettings.findOneAndUpdate(
        { scope: "global", companyId: null },
        { $set: update },
        { new: true, upsert: true }
      );

      await logActivity({
        userId: req.user._id,
        action: "BILLING_GLOBAL_UPDATE",
        description: "Superadmin updated global billing settings",
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        meta: {},
      });

      res.json({
        ok: true,
        message: "Global billing settings updated",
        settings,
      });
    } catch (err) {
      console.error("❌ Update global billing settings error:", err.message);
      res
        .status(500)
        .json({ error: "Server error updating global billing settings" });
    }
  }
);

/* ==========================================================
   🔹 3. COMPANY / MANAGER — Get company billing settings
   GET /api/billing-settings/company
   ========================================================== */
router.get(
  "/company",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const settings = await getOrCreateCompanySettings(companyId);

      res.json({ ok: true, settings });
    } catch (err) {
      console.error("❌ Get company billing settings error:", err.message);
      res
        .status(500)
        .json({ error: "Server error loading company billing settings" });
    }
  }
);

/* ==========================================================
   🔹 4. COMPANY OWNER — Update company billing settings
   PUT /api/billing-settings/company
   ========================================================== */
router.put(
  "/company",
  protect,
  authorizeRoles("company"), // manager can only view, not edit
  async (req, res) => {
    try {
      const companyId = req.user._id;

      const allowedFields = [
        "currency",
        "taxRate",
        "includeTax",
        "billingCycle",
        "invoicePrefix",

        "baseFee",
        "perKmFee",
        "minFee",
        "maxFee",
        "freeDeliveryThreshold",
        "surgePricingEnabled",
        "surgeMultiplier",

        "driverCommissionType",
        "driverCommissionValue",
        "driverReceiveDeliveryFee",
        "driverSalaryMode",
        "monthlySalaryAmount",

        "wishMoneyEnabled",
        "wishMoneyMerchantId",
        "wishMoneyKey",
        "wishMoneyCallbackUrl",

        "discountsEnabled",
        "maxDiscountPercent",
        "promoCodesEnabled",
        "promoCodes",

        "companyCommissionType",
        "companyCommissionValue",
        "companyShareOfDeliveryFee",

        "autoInvoiceCompanyEnabled",
        "autoInvoiceCustomerEnabled",
        "invoiceFooterNote",
        "signatureImage",
        "isActive",
      ];

      const update = {};
      Object.keys(req.body || {}).forEach((key) => {
        if (allowedFields.includes(key)) {
          update[key] = req.body[key];
        }
      });

      const settings = await BillingSettings.findOneAndUpdate(
        { scope: "company", companyId },
        { $set: update },
        { new: true, upsert: true }
      );

      await logActivity({
        userId: req.user._id,
        action: "BILLING_COMPANY_UPDATE",
        description: "Company updated its billing settings",
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        meta: { companyId },
      });

      res.json({
        ok: true,
        message: "Company billing settings updated",
        settings,
      });
    } catch (err) {
      console.error("❌ Update company billing settings error:", err.message);
      res
        .status(500)
        .json({ error: "Server error updating company billing settings" });
    }
  }
);

/* ==========================================================
   🔹 5. SUPERADMIN — Get billing settings for a company
   GET /api/billing-settings/company/:companyId
   (for support / debugging)
   ========================================================== */
router.get(
  "/company/:companyId",
  protect,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const { companyId } = req.params;

      const settings = await getOrCreateCompanySettings(companyId);

      res.json({ ok: true, settings });
    } catch (err) {
      console.error(
        "❌ Superadmin get company billing settings error:",
        err.message
      );
      res.status(500).json({
        error: "Server error loading company billing settings (admin)",
      });
    }
  }
);

export default router;
