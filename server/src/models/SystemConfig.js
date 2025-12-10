import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
  {
    maintenanceMode: { type: Boolean, default: false },
    globalPrimaryColor: { type: String, default: "#2563EB" },
    globalAccentColor: { type: String, default: "#10B981" },
    globalSecondaryColor: { type: String, default: "#1F2937" },

    // the company owner can change the system name or tagline
    systemName: { type: String, default: "SmartTrack+" },
    systemTagline: { type: String, default: "Delivery Tracking Platform" }
  },
  { timestamps: true }
);

export default mongoose.model("SystemConfig", systemConfigSchema);
