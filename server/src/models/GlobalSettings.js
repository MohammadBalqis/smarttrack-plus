import mongoose from "mongoose";

const globalSettingsSchema = new mongoose.Schema(
  {
    // PLATFORM SETTINGS
    allowNewCompanies: { type: Boolean, default: true },
    allowNewCustomers: { type: Boolean, default: true },
    allowTrips: { type: Boolean, default: true },
    allowPayments: { type: Boolean, default: true },

    // FINANCIAL SETTINGS
    defaultDeliveryFee: { type: Number, default: 3 },
    systemCommissionPercent: { type: Number, default: 5 }, // 5%

    // FEATURE TOGGLES
    features: {
      realtimeTracking: { type: Boolean, default: true },
      chat: { type: Boolean, default: true },
      qrConfirmation: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
      exportReports: { type: Boolean, default: true },
    },

    // MAINTENANCE MODE
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const GlobalSettings = mongoose.model("GlobalSettings", globalSettingsSchema);
export default GlobalSettings;
