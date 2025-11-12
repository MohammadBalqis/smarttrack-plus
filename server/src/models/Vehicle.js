import mongoose from "mongoose";

/* ==========================================================
   🚘 VEHICLE MODEL — Cars, Motors, and Fleet Management
   ========================================================== */
const vehicleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // company owner
      required: true,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // driver assigned
      default: null,
    },

    type: {
      type: String,
      enum: ["car", "motor"],
      required: true,
    },

    brand: { type: String, required: true },
    model: { type: String, required: true },
    plateNumber: { type: String, required: true, unique: true },

    // Vehicle status logic
    status: {
      type: String,
      enum: ["available", "active", "maintenance"],
      default: "available",
    },

    lastServiceDate: { type: Date, default: null },

    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

/* ==========================================================
   🚦 STATUS DEFINITIONS
   ==========================================================
   available   → not assigned to any driver
   active      → currently under use by a driver
   maintenance → temporarily unavailable due to repair or service
   ========================================================== */

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
