import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: String,
    address: String,

    /* ===============================
       Branding
    =============================== */
    logo: {
      type: String, // URL or /uploads/...
      default: null,
    },

    businessCategory: {
      type: String,
      default: "other",
    },

    businessCategoryCustom: String,
    commercialRegistrationNumber: String,

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ===============================
       Subscription & Billing
    =============================== */
    plan: {
      type: String,
      enum: ["starter", "growth", "pro", "enterprise"],
      default: "starter",
    },

    subscription: {
      tierKey: String,
      label: String,
      maxDrivers: Number,
      priceUsd: Number,
      isPastDue: {
        type: Boolean,
        default: false,
      },
    },

    billingStatus: {
      type: String,
      enum: ["active", "unpaid", "suspended"],
      default: "active",
    },

    /* ===============================
       API KEY
       - optional
       - indexed ONLY if exists
       - NEVER duplicated
    =============================== */
    apiKey: {
      type: String,
      default: null,
    },

    /* ===============================
       Visibility Flags (🔥 IMPORTANT)
    =============================== */
    isActive: {
      type: Boolean,
      default: true,
    },

    isApproved: {
      type: Boolean,
      default: false, // 🔥 REQUIRED for customer visibility
    },
  },
  {
    timestamps: true,
  }
);

/* ==========================================================
   SAFE UNIQUE INDEX (NO NULLS)
========================================================== */
companySchema.index(
  { apiKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      apiKey: { $type: "string" },
    },
  }
);

export default mongoose.model("Company", companySchema);
