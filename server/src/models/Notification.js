// server/src/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // success | warning | danger | info
    type: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
    },

    // trip | driver | order | payment | system
    category: {
      type: String,
      default: "system",
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    actionUrl: { type: String, default: null },

    icon: { type: String, default: "Bell" },

    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },

    extraData: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
