import mongoose from "mongoose";

/* ==========================================================
   🚘 VEHICLE MODEL — Cars, Motors & Full Fleet Management
========================================================== */
const vehicleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Company Owner
      required: true,
    },

    // 🔗 Driver assigned to the vehicle
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 🚗 Vehicle type
    type: {
      type: String,
      enum: ["car", "motor", "truck", "van", "pickup"],
      required: true,
    },

    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    plateNumber: { type: String, required: true, unique: true, trim: true },

    // 📸 Vehicle image
    vehicleImage: { type: String, default: null },

    // 🔧 Vehicle state
    status: {
      type: String,
      enum: ["available", "in_use", "maintenance"],
      default: "available",
    },

    // 🛠 Maintenance tracking
    lastServiceDate: { type: Date, default: null },
    nextServiceDue: { type: Date, default: null },

    // 🛣 Performance & Usage
    mileage: { type: Number, default: 0 }, // km
    fuelType: { type: String, enum: ["petrol", "diesel", "electric", "hybrid", "unknown"], default: "unknown" },
    engineCapacity: { type: String, default: null }, // 1.6L, 2.0L, etc.

    // 📍 Last known trip for dashboard preview
    lastTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    // Extra notes
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
