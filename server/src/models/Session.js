// server/src/models/Session.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenId: {
      type: String,
      index: true,
    }, // optional unique id per token (jti)
    deviceId: {
      type: String,
    }, // client-side random id if you send one
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    os: {
      type: String,
    },
    browser: {
      type: String,
    },
    location: {
      type: String,
    }, // optional (later from IP service)
    isActive: {
      type: Boolean,
      default: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// index to quickly get active sessions
sessionSchema.index({ userId: 1, isActive: 1 });

const Session = mongoose.model("Session", sessionSchema);
export default Session;
