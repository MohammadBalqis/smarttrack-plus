import mongoose from "mongoose";

const companyBillingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BillingPlan",
      required: true,
    },

    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },

    tripCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },

    companyEarnings: { type: Number, default: 0 },
    driverEarnings: { type: Number, default: 0 },
    platformEarnings: { type: Number, default: 0 },

    extraTripCharges: { type: Number, default: 0 },

    invoices: [
      {
        invoiceId: String,
        amount: Number,
        periodStart: Date,
        periodEnd: Date,
        pdfUrl: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const CompanyBilling = mongoose.model("CompanyBilling", companyBillingSchema);
export default CompanyBilling;
