// server/src/models/Notification.js
import mongoose from "mongoose";

/* ==========================================================
   🔔 NOTIFICATION MODEL
   Recipient can be: manager, company, driver, customer, superadmin
   - Supports:
     • role-based category (manager, driver, customer, company, system)
     • priority (low/normal/high)
     • linking to trips/orders etc.
========================================================== */

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification (User _id)
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional: link to company (useful for filtering later)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // company owner user
      default: null,
      index: true,
    },

    // Domain type: what this notification is about
    // (trip, order, driver, vehicle, system, chat, product...)
    type: {
      type: String,
      enum: [
        "trip",
        "order",
        "driver",
        "vehicle",
        "system",
        "chat",
        "product",
      ],
      default: "system",
      index: true,
    },

    // Category: who this notification is for (role)
    category: {
      type: String,
      enum: ["company", "manager", "driver", "customer", "system"],
      default: "system",
      index: true,
    },

    // Optional priority
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
      index: true,
    },

    // Short title or label
    title: { type: String, trim: true, default: "" },

    // Main message shown in UI
    message: { type: String, required: true },

    // Whether notification is read
    isRead: { type: Boolean, default: false, index: true },

    // Optional thumbnail image (driver avatar, product image, etc.)
    image: { type: String, default: null },

    // Optional link target for frontend navigation
    // Example: "/manager/trips/123"
    actionUrl: { type: String, default: null },

    // Backwards compatibility (if you used "link" before)
    link: { type: String, default: null },

    // Optional relationship to a trip
    relatedTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    // Extra flexible meta info (IDs, status, etc.)
    meta: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
