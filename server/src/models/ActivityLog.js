// server/src/models/ActivityLog.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/* ==========================================================
   🧾 ACTIVITY LOG MODEL
   - Stores all important actions in the system
   - Example actions:
     LOGIN_SUCCESS, LOGIN_FAILED, TRIP_CREATED, PAYMENT_COLLECTED, etc.
   ========================================================== */

const activityLogSchema = new Schema(
  {
    // Who performed the action
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Snapshot of user role at action time
    role: {
      type: String,
      default: "guest",
      index: true,
    },

    // Machine-readable action code
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // Human-readable message
    description: {
      type: String,
      trim: true,
    },

    // Category (auth, trip, payment, user, settings...)
    category: {
      type: String,
      default: "system",
      index: true,
      trim: true,
    },

    // Target model (User, Trip, Company, Vehicle…)
    targetModel: {
      type: String,
      default: null,
      trim: true,
    },

    // Target id
    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    // Technical info
    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    // Flexible JSON metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Create model
const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

// ⭐ BOTH EXPORTS (Default + Named)
export default ActivityLog;
export { ActivityLog };
