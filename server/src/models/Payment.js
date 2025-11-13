import mongoose from "mongoose";

/* ==========================================================
   💳 PAYMENT MODEL — ties revenue to trips & drivers
   ========================================================== */
const paymentSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // company
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // driver
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // customer
      required: true,
      index: true,
    },

    // money
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["cash", "card", "wallet", "cod"], default: "cod" },

    // state
    status: { type: String, enum: ["pending", "paid", "refunded"], default: "paid" },
    collectedBy: { type: String, enum: ["driver", "company"], default: "driver" },

    paidAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
