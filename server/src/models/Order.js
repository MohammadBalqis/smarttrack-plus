// server/src/models/Order.js
import mongoose from "mongoose";

/* ==========================================================
   🛒 ORDER ITEM SCHEMA
========================================================== */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    subtotal: { type: Number }, // price * quantity
  },
  { _id: false }
);

/* ==========================================================
   🧾 ORDER SCHEMA
========================================================== */
const orderSchema = new mongoose.Schema(
  {
    /* ------------------------------------------------------
       👤 CUSTOMER
    ------------------------------------------------------ */
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ------------------------------------------------------
       🏢 COMPANY (the store that received the order)
       ⚠️ IMPORTANT: You used `User` instead of `Company`
       and you told me you don’t want to change structure.
       So we keep `ref: "User"` exactly as in your system.
    ------------------------------------------------------ */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ------------------------------------------------------
       🚗 DRIVER + VEHICLE
    ------------------------------------------------------ */
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    /* ------------------------------------------------------
       🔗 TRIP CONNECTION (optional)
    ------------------------------------------------------ */
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    /* ------------------------------------------------------
       🛒 ITEMS
    ------------------------------------------------------ */
    items: [orderItemSchema],

    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    /* ------------------------------------------------------
       🚦 ORDER STATUS
    ------------------------------------------------------ */
    status: {
      type: String,
      enum: [
        "pending",      // customer placed order
        "accepted",     // company accepted
        "preparing",    // preparing items
        "assigned",     // driver assigned
        "delivering",   // driver on route
        "delivered",    // driver delivered
        "completed",    // customer confirmed
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    /* ------------------------------------------------------
       📝 CUSTOMER NOTES
    ------------------------------------------------------ */
    customerNotes: { type: String, default: "" },

    /* ------------------------------------------------------
       📍 LOCATIONS
    ------------------------------------------------------ */
    pickupLocation: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },

    dropoffLocation: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },

    /* ------------------------------------------------------
       📅 TIMELINE HISTORY
    ------------------------------------------------------ */
    timeline: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
