// server/src/models/Vehicle.js
import mongoose from "mongoose";

/* ==========================================================
   🚘 VEHICLE MODEL — Cars, Motors & Fleet Management
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

    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    plateNumber: { type: String, required: true, unique: true, trim: true },

    // Vehicle status
    status: {
      type: String,
      enum: ["available", "in_use", "maintenance"],
      default: "available",
    },

    // 📸 Vehicle image (relative URL)
    vehicleImage: { type: String, default: null },

    lastServiceDate: { type: Date, default: null },

    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
