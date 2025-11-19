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
    logo: { type: String, default: null }, // URL path

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
       🎨 BRANDING & WHITE-LABELING (10H)
    ========================================================== */
    branding: {
      logoUrl: { type: String, default: null },

      primaryColor: { type: String, default: "#3b82f6" },   // blue
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
       ⭐ PLAN & BILLING (for future)
    ========================================================== */
    plan: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise"],
      default: "free",
    },
    billingStatus: {
      type: String,
      enum: ["active", "unpaid", "suspended"],
      default: "active",
    },
/* ==========================================================
   🔑 API ACCESS (Public Integration)
========================================================== */
apiKey: { type: String, default: null, unique: true },
apiEnabled: { type: Boolean, default: true },
apiRateLimitPerMinute: { type: Number, default: 30 },  // protect your server
apiWebhookUrl: { type: String, default: null },        // to send updates

    /* ==========================================================
       ⚙️ STATUS
    ========================================================== */
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);
export default Company;
