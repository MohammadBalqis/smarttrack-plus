// server/src/models/BillingSettings.js
import mongoose from "mongoose";

/* ==========================================================
   💰 BILLING SETTINGS MODEL
   Scope: "global" (superadmin) or "company"
   ========================================================== */

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: 0, // 0 = no limit
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    maxUsagePerCustomer: { type: Number, default: 0 }, // 0 = unlimited
    maxTotalUsage: { type: Number, default: 0 }, // 0 = unlimited
    totalUsed: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const billingSettingsSchema = new mongoose.Schema(
  {
    /* ------------------------------------------------------
       Scope
       ------------------------------------------------------ */
    scope: {
      type: String,
      enum: ["global", "company"],
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // company user
      default: null,
      index: true,
    },

    /* ------------------------------------------------------
       A) General billing
       ------------------------------------------------------ */
    currency: {
      type: String,
      default: "USD",
    },
    taxRate: {
      type: Number,
      default: 0, // %
      min: 0,
    },
    includeTax: {
      type: Boolean,
      default: true,
    },
    billingCycle: {
      type: String,
      enum: ["weekly", "monthly"],
      default: "monthly",
    },
    invoicePrefix: {
      type: String,
      default: "INV",
      trim: true,
    },

    /* ------------------------------------------------------
       B) Delivery fee rules
       ------------------------------------------------------ */
    baseFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    perKmFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    minFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxFee: {
      type: Number,
      default: 0, // 0 = no limit
      min: 0,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 0, // 0 = disabled
      min: 0,
    },
    surgePricingEnabled: {
      type: Boolean,
      default: false,
    },
    surgeMultiplier: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* ------------------------------------------------------
       C) Driver payout rules
       ------------------------------------------------------ */
    driverCommissionType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },
    driverCommissionValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    driverReceiveDeliveryFee: {
      type: Boolean,
      default: true,
    },
    driverSalaryMode: {
      type: String,
      enum: ["trip_based", "monthly"],
      default: "trip_based",
    },
    monthlySalaryAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ------------------------------------------------------
       D) Online payment (Wish Money)
       ------------------------------------------------------ */
    wishMoneyEnabled: {
      type: Boolean,
      default: false,
    },
    wishMoneyMerchantId: {
      type: String,
      default: null,
      trim: true,
    },
    wishMoneyKey: {
      type: String,
      default: null,
      trim: true,
    },
    wishMoneyCallbackUrl: {
      type: String,
      default: null,
      trim: true,
    },

    /* ------------------------------------------------------
       E) Discounts & Promo Codes
       ------------------------------------------------------ */
    discountsEnabled: {
      type: Boolean,
      default: true,
    },
    maxDiscountPercent: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    promoCodesEnabled: {
      type: Boolean,
      default: true,
    },
    promoCodes: {
      type: [promoCodeSchema],
      default: [],
    },

    /* ------------------------------------------------------
       F) Company revenue rules
       ------------------------------------------------------ */
    companyCommissionType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },
    companyCommissionValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    companyShareOfDeliveryFee: {
      type: Number,
      default: 100, // % of delivery fee going to company
      min: 0,
      max: 100,
    },

    /* ------------------------------------------------------
       G) Invoices
       ------------------------------------------------------ */
    autoInvoiceCompanyEnabled: {
      type: Boolean,
      default: true,
    },
    autoInvoiceCustomerEnabled: {
      type: Boolean,
      default: false,
    },
    invoiceFooterNote: {
      type: String,
      default: "",
      trim: true,
    },
    signatureImage: {
      type: String,
      default: null, // path or URL
    },

    /* ------------------------------------------------------
       Status
       ------------------------------------------------------ */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* Ensure only one doc per scope+company */
billingSettingsSchema.index(
  { scope: 1, companyId: 1 },
  { unique: true }
);

const BillingSettings = mongoose.model(
  "BillingSettings",
  billingSettingsSchema
);

export default BillingSettings;
