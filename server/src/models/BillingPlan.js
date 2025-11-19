import mongoose from "mongoose";

const billingPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },

    description: { type: String, default: "" },

    monthlyPrice: { type: Number, required: true },

    tripLimit: { type: Number, default: 500 }, // 0 = unlimited

    extraTripPrice: { type: Number, default: 0 }, // per extra trip cost

    platformCommissionPercent: { type: Number, default: 0 }, // SaaS commission

    gatewayFeePercent: { type: Number, default: 0 }, // e.g., Wish Money

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const BillingPlan = mongoose.model("BillingPlan", billingPlanSchema);
export default BillingPlan;
