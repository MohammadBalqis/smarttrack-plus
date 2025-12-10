// server/src/models/SubscriptionInvoice.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * 💳 SubscriptionInvoice
 * - One invoice per company per billing period
 * - companyId = User with role "company" (stays consistent with Trip & Payment)
 */
const subscriptionInvoiceSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User", // your companies are Users with role: "company"
      required: true,
      index: true,
    },

    // Billing period (monthly, or whatever you choose)
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    // Snapshot at billing time
    driverCount: { type: Number, required: true },
    tier: {
      type: String,
      enum: ["0-10", "11-30", "31-50", "50+"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    // Status
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
      index: true,
    },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date, default: null },

    // Optional meta
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const SubscriptionInvoice = mongoose.model(
  "SubscriptionInvoice",
  subscriptionInvoiceSchema
);

export default SubscriptionInvoice;
