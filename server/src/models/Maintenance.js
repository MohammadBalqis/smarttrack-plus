// server/src/models/Maintenance.js
import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    // 🔗 Vehicle being serviced
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    // 🏢 Company responsible for maintenance
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // company user
      required: true,
    },

    // 👨‍🔧 Optional mechanic name or ID
    mechanicName: { type: String, trim: true },

    // 🧾 Description of the maintenance work
    description: { type: String, required: true },

    // 💰 Total cost
    cost: { type: Number, required: true, min: 0 },

    // 📅 Dates
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },

    // ⚙️ Status of maintenance
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },

    // 📝 Optional notes
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);
export default Maintenance;
