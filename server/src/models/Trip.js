// server/src/models/Trip.js
import mongoose from "mongoose";

/* ==========================================================
   🛍️ ORDER ITEM (for cart system)
   ========================================================== */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    name: { type: String },        // snapshot product name
    price: { type: Number },       // snapshot product price
    quantity: { type: Number },    // ordered quantity
    subtotal: { type: Number },    // price * quantity
  },
  { _id: false }
);

/* ==========================================================
   🛰 ROUTE POINT (for live tracking)
   ========================================================== */
const routePointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ==========================================================
   📍 LOCATION (pickup / dropoff)
   ========================================================== */
const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true }, // text address
    lat: { type: Number },                     // optional GPS
    lng: { type: Number },                     // optional GPS
  },
  { _id: false }
);

/* ==========================================================
   🚚 TRIP MODEL — Company ▸ Driver ▸ Customer
   ========================================================== */
const tripSchema = new mongoose.Schema(
  {
    // 🔗 Relations
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // the company selected by the customer
      required: true,
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

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
      index: true,
    },

    /* ==========================================================
       🛒 MULTI-PRODUCT CART (ADDED FOR 12D)
       ========================================================== */
    orderItems: [orderItemSchema],   // NEW FIELD
    totalAmount: { type: Number, default: 0 }, // NEW FIELD

    // 📍 Locations
    pickupLocation: { type: locationSchema, required: true },
    dropoffLocation: { type: locationSchema, required: true },

    // 💰 Delivery fee — does NOT replace order total
    deliveryFee: { type: Number, default: 0, min: 0 },

    // 📌 Status lifecycle
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },

    // 💵 Payment status
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "refunded"],
      default: "unpaid",
    },

    // 🙋‍♂️ Customer metadata
    createdByCustomer: { type: Boolean, default: false },
    customerAddress: { type: String },
    customerPhone: { type: String },
    customerNotes: { type: String },

    // 🕒 Timeline
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    totalDistance: { type: Number, default: 0 },

    // 🛰 Tracking
    routeHistory: [routePointSchema],

    // 👤 Delivery confirmation (QR)
    customerConfirmed: { type: Boolean, default: false },
    confirmationTime: { type: Date, default: null },
  },
  { timestamps: true }
);

const Trip = mongoose.model("Trip", tripSchema);
export default Trip;
