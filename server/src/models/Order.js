import mongoose from "mongoose";

/* ==========================================================
   📦 ORDER MODEL — Delivery Tracking
   ========================================================== */
const orderSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // created by a company
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // assigned driver
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // target customer
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true, // delivery vehicle
    },

    // Order details
    pickupLocation: { type: String, required: true },
    deliveryLocation: { type: String, required: true },
    description: { type: String },
    price: { type: Number, default: 0 },

    // Order lifecycle statuses
    status: {
      type: String,
      enum: ["pending", "in_progress", "delivered", "completed", "cancelled"],
      default: "pending",
    },

    // Customer confirmation
    isConfirmedByCustomer: { type: Boolean, default: false },

    deliveryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
