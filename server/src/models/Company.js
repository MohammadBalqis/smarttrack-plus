// server/src/models/Company.js
import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    /* ==========================================================
       📌 BASIC COMPANY INFO
    ========================================================== */
    name: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    address: { type: String },

    /* ==========================================================
       🖼️ COMPANY PROFILE
    ========================================================== */
    logo: { type: String, default: null }, // URL / path

    businessCategory: {
      type: String,
      enum: [
        "restaurant",
        "pharmacy",
        "market",
        "flowers",
        "electronics",
        "clothes",
        "courier",
        "other",
      ],
      default: "other",
    },

    commercialRegistrationNumber: { type: String, default: null },

    /* ==========================================================
       🧭 COMPANY SETTINGS
    ========================================================== */
    settings: {
      autoAssignDrivers: { type: Boolean, default: false },
      autoAssignNearestDriver: { type: Boolean, default: false },

      allowDriversToCancel: { type: Boolean, default: false },
      requireCustomerQRConfirmation: { type: Boolean, default: true },

      workingHours: {
        open: { type: String, default: "08:00" },
        close: { type: String, default: "22:00" },
        timezone: { type: String, default: "Asia/Beirut" },
      },

      deliveryFeeDefault: { type: Number, default: 3 },
      maxDeliveryDistanceKm: { type: Number, default: 20 },
    },

    /* ==========================================================
       🎨 BRANDING & WHITE-LABELING
    ========================================================== */
    branding: {
      logoUrl: { type: String, default: null },

      primaryColor: { type: String, default: "#3b82f6" }, // blue
      secondaryColor: { type: String, default: "#1e293b" }, // slate
      sidebarColor: { type: String, default: "#0f172a" },
      accentColor: { type: String, default: "#3b82f6" },

      emailBranding: {
        headerColor: { type: String, default: "#3b82f6" },
        footerColor: { type: String, default: "#0f172a" },
        signature: { type: String, default: "SmartTrack Plus" },
      },

      invoiceBranding: {
        headerColor: { type: String, default: "#3b82f6" },
        footerColor: { type: String, default: "#0f172a" },
        stampImage: { type: String, default: null },
      },

      // Optional advanced white-labeling
      customDomain: { type: String, default: null },

      mobileTheme: {
        splashImage: { type: String, default: null },
        appPrimaryColor: { type: String, default: "#3b82f6" },
      },
    },

    /* ==========================================================
       🧑‍💼 COMPANY OWNERSHIP
    ========================================================== */
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ==========================================================
       👥 MEMBERS (Managers + Drivers)
    ========================================================== */
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /* ==========================================================
       ⭐ PLAN & BILLING (Subscription based on drivers)
       Pricing today:
         ▸ 0–10  drivers → $50
         ▸ 11–30 drivers → $80
         ▸ 31–50 drivers → $100
         ▸ 51+   drivers → $150
    ========================================================== */

    // Legacy simple plan (you can still use it for some old logic)
    plan: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise"],
      default: "free",
    },

    // Short overall billing status (for quick filters)
    billingStatus: {
      type: String,
      enum: ["active", "unpaid", "suspended"],
      default: "active",
    },

    // 🔄 Recurring subscription snapshot used by System Owner
    subscription: {
      // key to use in code, e.g. "tier_0_10", "tier_11_30"
      tierKey: { type: String, default: null },

      // Human readable label: "0–10 drivers", "11–30 drivers", etc.
      label: { type: String, default: null },

      maxDrivers: { type: Number, default: 0 },

      // Price per billing period (monthly) in USD
      priceUsd: { type: Number, default: 0 },

      // Last counted drivers (for that tier snapshot)
      lastDriverCount: { type: Number, default: 0 },

      // Billing meta
      billingPeriod: { type: String, default: "monthly" },
      nextBillingDate: { type: Date, default: null },
      lastBilledAt: { type: Date, default: null },

      // Late payment flags
      isPastDue: { type: Boolean, default: false },

      // Link to the last invoice if you want
      lastInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionInvoice",
        default: null,
      },
    },

    /* ==========================================================
       🔑 API ACCESS (Public Integration)
    ========================================================== */
    apiKey: { type: String, default: null, unique: true },
    apiEnabled: { type: Boolean, default: true },
    apiRateLimitPerMinute: {
      type: Number,
      default: 30, // protect your server
    },
    apiWebhookUrl: { type: String, default: null }, // to send updates

    /* ==========================================================
       ⚙️ STATUS
    ========================================================== */
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);
export default Company;
