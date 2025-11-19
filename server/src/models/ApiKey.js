// server/src/models/ApiKey.js
import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    label: { type: String, required: true, trim: true }, // e.g. "Mobile App Key", "POS Partner"

    apiKey: {
      type: String,
      required: true,
      unique: true,
    },

    scopes: {
      type: [String],
      default: [], // e.g. ["trips:read", "payments:read"]
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdFromIp: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const ApiKey = mongoose.model("ApiKey", apiKeySchema);
export default ApiKey;
