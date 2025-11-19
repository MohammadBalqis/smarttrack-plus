// server/src/models/Webhook.js
import mongoose from "mongoose";

const webhookSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    events: {
      type: [String],
      default: [], // e.g. ["trip.created", "trip.completed", "payment.collected"]
    },

    secretToken: {
      type: String,
      default: null, // used to sign payloads later
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    // Monitoring
    lastStatusCode: {
      type: Number,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Webhook = mongoose.model("Webhook", webhookSchema);
export default Webhook;
