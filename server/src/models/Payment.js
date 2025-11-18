// server/src/models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    /* ==========================================================
       🔹 Basic Payment Metadata
       ========================================================== */
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },

    companyId: {
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

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /* ==========================================================
       💰 Amount Breakdown
       ========================================================== */

    // TOTAL paid (customer final amount)
    totalAmount: { type: Number, required: true },

    // Delivery Fee (from trip)
    deliveryFee: { type: Number, default: 0 },

    // Product/service price (future e-commerce expansion)
    productTotal: { type: Number, default: 0 },

    // Discounts
    discountAmount: { type: Number, default: 0 },
    promoCodeUsed: { type: String, default: null },

    // Tax
    taxAmount: { type: Number, default: 0 },

    // If using Wish Money / Online Payment Gateway
    gatewayFee: { type: Number, default: 0 },

    /* ==========================================================
       🧮 Earnings Breakdown
       ========================================================== */

    driverEarning: { type: Number, default: 0 },

    companyEarning: { type: Number, default: 0 },

    platformEarning: { type: Number, default: 0 }, // for SaaS / system owner

    /* ==========================================================
       💳 Payment Details
       ========================================================== */

    method: {
      type: String,
      enum: [
        "cod",            // Cash on Delivery
        "wallet",         // Internal wallet
        "wish_money",     // Online gateway (your new option)
        "manual",         // Admin compensation or override
      ],
      default: "cod",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    transactionId: { type: String, default: null }, // From Wish Money API
    gatewayResponse: { type: Object, default: {} }, // Raw API response

    /* ==========================================================
       📄 Invoices
       ========================================================== */

    invoiceNumber: { type: String, default: null },
    invoicePdfUrl: { type: String, default: null },

    generationDate: { type: Date, default: null },

    /* ==========================================================
       🕒 Audit
       ========================================================== */

    paidAt: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
