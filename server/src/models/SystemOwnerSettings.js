import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    /* ===============================
       PLATFORM BRANDING
    =============================== */
    platformLogo: { type: String, default: null },
    platformName: { type: String, default: "SmartTrack+ Platform" },

    /* ===============================
       BILLING CONFIG
    =============================== */
    baseCurrency: { type: String, default: "USD" },

    subscriptionPricing: {
      drivers_0_10: { type: Number, default: 50 },
      drivers_11_30: { type: Number, default: 80 },
      drivers_31_50: { type: Number, default: 100 },
      drivers_51_plus: { type: Number, default: 150 },
    },

    billingGraceDays: { type: Number, default: 7 },

    invoiceFooter: {
      type: String,
      default: "Thank you for using SmartTrack+.",
    },

    /* ===============================
       CONTACT INFO
    =============================== */
    supportEmail: { type: String, default: "support@smarttrack.com" },
    supportPhone: { type: String, default: "+961000000" },

    /* ===============================
       SYSTEM CONTROL
    =============================== */
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      default: "The system is under scheduled maintenance.",
    },
  },
  { timestamps: true }
);

const SystemOwnerSettings = mongoose.model(
  "SystemOwnerSettings",
  settingsSchema
);

export default SystemOwnerSettings;
