// server/src/models/Notification.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // Who will receive this notification (driver, customer, manager, company, owner)
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 REQUIRED FOR MULTI-COMPANY ISOLATION
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // always required, ensures notifications stay inside same company
    },

    // Short title e.g. "New Trip Assigned"
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Main message
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // High-level type (for filters / colors)
    type: {
      type: String,
      enum: ["assignment", "update", "status", "payment", "system"],
      default: "system",
    },

    // Audience category (for advanced filters)
    category: {
      type: String,
      enum: ["driver", "customer", "manager", "company", "owner", "system"],
      default: "system",
    },

    // Extra visual + behavior options (Option C)
    image: {
      type: String, // e.g. driver profile image or car image URL
      default: null,
    },

    actionUrl: {
      type: String, // e.g. "/trips/66123abc" in frontend
      default: null,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },

    sound: {
      type: String, // e.g. "ding.mp3"
      default: null,
    },

    // Read state
    isRead: {
      type: Boolean,
      default: false,
    },

    // Optional: link to a trip
    relatedTripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    // Extra payload (for full driver data, etc.)
    extraData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
