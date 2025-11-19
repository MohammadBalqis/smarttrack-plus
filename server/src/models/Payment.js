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
       💰 Amount Breakdown (Customer FINAL payment)
       ========================================================== */

    totalAmount: { type: Number, required: true },         // Final customer payment
    deliveryFee: { type: Number, default: 0 },             // From trip
    productTotal: { type: Number, default: 0 },            // Future e-commerce
    discountAmount: { type: Number, default: 0 },
    promoCodeUsed: { type: String, default: null },

    taxAmount: { type: Number, default: 0 },

    gatewayFee: { type: Number, default: 0 },              // Wish Money gateway fee

    currency: { type: String, default: "USD" },            // NEW (clean)

    /* ==========================================================
       🧮 Earnings Breakdown (snapshot)
       ========================================================== */

    driverEarning: { type: Number, default: 0 },
    companyEarning: { type: Number, default: 0 },
    platformEarning: { type: Number, default: 0 },          // System owner earning

    /* 🔥 NEW — Clean, organized breakdown for analytics */
    paymentBreakdown: {
      type: Object,
      default: {}, // { deliveryFee, productTotal, discount, tax, gatewayFee }
    },

    /* ==========================================================
       💳 Payment Details
       ========================================================== */

    method: {
      type: String,
      enum: [
        "cod",          // Cash on delivery
        "cash",         // Cash (explicit)
        "card",         // Debit / credit
        "wallet",       // Internal wallet
        "wish_money",   // Wish Money online gateway
        "manual",       // Adjustments / admin
      ],
      default: "cod",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    transactionId: { type: String, default: null },         // Wish money transaction ref
    gatewayResponse: { type: Object, default: {} },         // Raw API response
    isPlatformFeeApplied: { type: Boolean, default: false }, // NEW flag

    /* ==========================================================
       📄 Invoice Attachments (snapshot)
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

    /* ==========================================================
       🔧 Meta (Extensible)
       ========================================================== */
    meta: { type: Object, default: {} },                    // NEW — for expansion
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
