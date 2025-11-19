// server/src/models/Invoice.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    // Relations
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // company
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /* -----------------------------------------
       📑 Invoice identity
       ----------------------------------------- */
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currency: {
      type: String,
      default: "USD", // you can change per project or via settings
    },

    /* -----------------------------------------
       💰 Amount details (snapshot)
       ----------------------------------------- */
    itemsSubtotal: { type: Number, default: 0 }, // products total
    deliveryFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 }, // in %
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet", "cod", "wish_money", "unknown"],
      default: "unknown",
    },

    status: {
      type: String,
      enum: ["draft", "unpaid", "paid", "cancelled", "refunded"],
      default: "unpaid",
      index: true,
    },

    /* -----------------------------------------
       🧾 Snapshot info for PDF / UI
       ----------------------------------------- */
    companyName: { type: String, trim: true },
    customerName: { type: String, trim: true },
    customerEmail: { type: String, trim: true },
    customerPhone: { type: String, trim: true },

    /* -----------------------------------------
       🕒 Dates
       ----------------------------------------- */
    issuedAt: { type: Date, default: Date.now },
    dueAt: { type: Date, default: null },

    /* -----------------------------------------
       📝 Extra
       ----------------------------------------- */
    notes: { type: String, trim: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
