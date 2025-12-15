// server/src/models/Trip.js
import mongoose from "mongoose";

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
   📍 LOCATION
========================================================== */
const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

/* ==========================================================
   🚚 TRIP
========================================================== */
const tripSchema = new mongoose.Schema(
  {
    /* 🔗 RELATIONS */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      index: true,
    },

    /* 📍 LOCATIONS */
    pickupLocation: { type: locationSchema, required: true },
    dropoffLocation: { type: locationSchema, required: true },

    /* 🚦 STATUS */
    status: {
      type: String,
      enum: ["assigned", "in_progress", "delivered", "cancelled"],
      default: "assigned",
      index: true,
    },

    /* 🕒 TIMING */
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    totalDistance: { type: Number, default: 0 },

    /* 🛰 LIVE TRACKING */
    routeHistory: [routePointSchema],

    /* 🔐 DELIVERY CONFIRMATION (QR) */
    confirmationCode: {
      type: String,
      index: true,
    },

    customerConfirmed: { type: Boolean, default: false },
    confirmationTime: { type: Date, default: null },

    /* 🧭 LIVE STATUS */
    liveStatus: {
      type: String,
      default: "Driver Assigned",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Trip", tripSchema);
