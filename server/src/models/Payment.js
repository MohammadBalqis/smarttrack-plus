// server/src/models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    /* ==========================================================
       🔗 SOURCE: Trip OR Order
       ========================================================== */
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
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
    totalAmount: { type: Number, required: true },   // Final customer payment
    deliveryFee: { type: Number, default: 0 },
    productTotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    promoCodeUsed: { type: String, default: null },

    taxAmount: { type: Number, default: 0 },
    gatewayFee: { type: Number, default: 0 },

    currency: { type: String, default: "USD" },

    /* ==========================================================
       🧮 Earnings Breakdown (snapshot for history)
       ========================================================== */
    driverEarning: { type: Number, default: 0 },
    companyEarning: { type: Number, default: 0 },
    platformEarning: { type: Number, default: 0 },

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
        "cod",
        "cash",
        "card",
        "wallet",
        "wish_money",
        "manual",
      ],
      default: "cod",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    transactionId: { type: String, default: null },
    gatewayResponse: { type: Object, default: {} },
    isPlatformFeeApplied: { type: Boolean, default: false },

    /* ==========================================================
       📄 Invoice Snapshot
       ========================================================== */
    invoiceNumber: { type: String, default: null },
    invoicePdfUrl: { type: String, default: null },
    generationDate: { type: Date, default: null },

    paidAt: { type: Date, default: null },

    /* ==========================================================
       👤 Audit
       ========================================================== */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: { type: Boolean, default: true },

    /* ==========================================================
       🔧 Extensible Meta
       ========================================================== */
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
