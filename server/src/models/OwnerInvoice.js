// server/src/models/OwnerInvoice.js
import mongoose from "mongoose";

const ownerInvoiceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    driverCountSnapshot: { type: Number, default: 0 },
    tierKey: { type: String, required: true },
    tierLabel: { type: String, required: true },
    maxDrivers: { type: Number, required: true },

    amountUsd: { type: Number, required: true },

    // "pending" → waiting for payment
    // "paid"    → completed
    // "past_due"→ not paid after due date
    status: {
      type: String,
      enum: ["pending", "paid", "past_due"],
      default: "pending",
      index: true,
    },

    dueDate: { type: Date, required: true },

    paidAt: { type: Date, default: null },

    notes: { type: String, default: null },
  },
  { timestamps: true }
);

const OwnerInvoice = mongoose.model("OwnerInvoice", ownerInvoiceSchema);
export default OwnerInvoice;
