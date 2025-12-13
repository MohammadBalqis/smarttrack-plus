import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true },

    phone: String,
    address: String,

    businessCategory: { type: String, default: "other" },
    businessCategoryCustom: String,
    commercialRegistrationNumber: String,

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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
      isPastDue: { type: Boolean, default: false },
    },

    billingStatus: {
      type: String,
      enum: ["active", "unpaid", "suspended"],
      default: "active",
    },

    /* 🔑 API KEY — SAFE */
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
