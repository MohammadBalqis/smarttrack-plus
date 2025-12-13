// server/src/models/Order.js
import mongoose from "mongoose";

/* ==========================================================
   🛒 ORDER ITEM (PRODUCT SNAPSHOT)
   - Snapshot protects analytics if product changes later
========================================================== */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    // Snapshot fields (do NOT change after order)
    name: { type: String, required: true },
    category: { type: String, default: "general" },
    price: { type: Number, required: true, min: 0 },

    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true }, // price * quantity
  },
  { _id: false }
);

/* ==========================================================
   🧾 ORDER
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
       🏢 COMPANY (store)
       (kept as User ref per your architecture)
    ------------------------------------------------------ */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ------------------------------------------------------
       🏪 BRANCH (IMPORTANT FOR BRANCH STOCK)
    ------------------------------------------------------ */
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
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
       🔗 TRIP
    ------------------------------------------------------ */
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    /* ------------------------------------------------------
       🛒 ITEMS
    ------------------------------------------------------ */
    items: {
      type: [orderItemSchema],
      required: true,
    },

    /* ------------------------------------------------------
       💰 PRICING
    ------------------------------------------------------ */
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    /* ------------------------------------------------------
       🚦 STATUS
    ------------------------------------------------------ */
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "preparing",
        "assigned",
        "delivering",
        "delivered",
        "completed",
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
      address: String,
      lat: Number,
      lng: Number,
    },

    dropoffLocation: {
      address: String,
      lat: Number,
      lng: Number,
    },

    /* ------------------------------------------------------
       📜 TIMELINE
    ------------------------------------------------------ */
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

/* ==========================================================
   🔎 INDEXES FOR ANALYTICS & REPORTS
========================================================== */
orderSchema.index({ companyId: 1, createdAt: -1 });
orderSchema.index({ companyId: 1, status: 1 });
orderSchema.index({ "items.productId": 1 });

/* ==========================================================
   EXPORT
========================================================== */
export default mongoose.model("Order", orderSchema);
