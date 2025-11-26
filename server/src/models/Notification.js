import mongoose from "mongoose";

/* ==========================================================
   🔔 NOTIFICATION MODEL
   Recipient can be: manager, company, driver, customer, superadmin
========================================================== */

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
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

    // Trip / order / driver / vehicle / system
    type: {
      type: String,
      enum: ["trip", "order", "driver", "vehicle", "system"],
      default: "system",
      index: true,
    },

    // Short title or label if needed later
    title: { type: String, trim: true, default: "" },

    // Main message shown in UI
    message: { type: String, required: true },

    // Whether notification is read
    isRead: { type: Boolean, default: false, index: true },

    // Optional link target (for frontend to navigate)
    // Example: "/manager/trips/123"
    link: { type: String, default: null },

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
