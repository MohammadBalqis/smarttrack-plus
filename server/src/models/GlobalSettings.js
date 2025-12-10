// server/src/models/GlobalSettings.js
import mongoose from "mongoose";

const subscriptionTierSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true, // e.g. "drivers_0_10"
    },
    label: {
      type: String,
      required: true, // e.g. "0–10 drivers"
    },
    minDrivers: {
      type: Number,
      required: true,
      default: 0,
    },
    maxDrivers: {
      type: Number,
      required: false, // null = no upper limit
    },
    priceUsd: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const globalSettingsSchema = new mongoose.Schema(
  {
    /* ==========================================================
       🌐 PLATFORM INFO
    ========================================================== */
    platformName: {
      type: String,
      default: "SmartTrack+",
    },
    platformCurrency: {
      type: String,
      default: "USD",
    },
    supportEmail: {
      type: String,
      default: "support@smarttrackplus.app",
    },

    /* ==========================================================
       🛡 MAINTENANCE MODE
       (already used in some controllers)
    ========================================================== */
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default:
        "The system is temporarily under maintenance. Please try again later.",
    },

    /* ==========================================================
       💳 BILLING DEFAULTS
    ========================================================== */
    billingGraceDays: {
      type: Number,
      default: 7, // days after due date before "overdue"
    },
    invoiceFooterNote: {
      type: String,
      default: "Thank you for using SmartTrack+.",
    },

    /* ==========================================================
       💰 SUBSCRIPTION TIERS (driver-based)
       Used by System Owner to see / adjust pricing strategy.
    ========================================================== */
    subscriptionTiers: {
      type: [subscriptionTierSchema],
      default: () => [
        {
          key: "drivers_0_10",
          label: "0–10 drivers",
          minDrivers: 0,
          maxDrivers: 10,
          priceUsd: 50,
          isActive: true,
        },
        {
          key: "drivers_11_30",
          label: "11–30 drivers",
          minDrivers: 11,
          maxDrivers: 30,
          priceUsd: 80,
          isActive: true,
        },
        {
          key: "drivers_31_50",
          label: "31–50 drivers",
          minDrivers: 31,
          maxDrivers: 50,
          priceUsd: 100,
          isActive: true,
        },
        {
          key: "drivers_51_plus",
          label: "51+ drivers",
          minDrivers: 51,
          maxDrivers: null, // no upper limit
          priceUsd: 150,
          isActive: true,
        },
      ],
    },

    /* ==========================================================
       🔐 FUTURE: OWNER SECURITY / OTHER FLAGS
    ========================================================== */
    // Example: enforceTwoFactorForOwners: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const GlobalSettings = mongoose.model(
  "GlobalSettings",
  globalSettingsSchema
);

export default GlobalSettings;
