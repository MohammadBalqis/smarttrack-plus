import mongoose from "mongoose";

/* ==========================================================
   🚘 VEHICLE MODEL — DRIVER-BOUND VEHICLES ONLY
   Vehicles are created ONLY during driver verification
========================================================== */
const vehicleSchema = new mongoose.Schema(
  {
    /* =========================
       OWNERSHIP
    ========================= */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
      index: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =========================
       SOURCE CONTROL
    ========================= */
    createdFromDriver: {
      type: Boolean,
      default: true,
      immutable: true,
    },

    /* =========================
       VEHICLE INFO
    ========================= */
    type: {
      type: String,
      enum: ["car", "motor", "truck", "van", "pickup"],
      required: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    plateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    vehicleImage: {
      type: String,
      default: null,
    },

    /* =========================
       DRIVER DOCUMENTS
    ========================= */
    driverCertificate: {
      type: String,
      required: true, // comes from driver verification
    },

    /* =========================
       STATUS (COMPANY CONTROL)
    ========================= */
    status: {
      type: String,
      enum: ["active", "maintenance"],
      default: "active",
      index: true,
    },

    /* =========================
       TRIP TRACKING
    ========================= */
    lastTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    /* =========================
       NOTES
    ========================= */
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

/* ==========================================================
   INDEXES
========================================================== */
vehicleSchema.index({ companyId: 1, driverId: 1 });
vehicleSchema.index({ plateNumber: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
