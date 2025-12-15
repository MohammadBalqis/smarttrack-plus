// server/src/models/Driver.js
import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema(
  {
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },

    // Linked login account (User with role="driver")
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },

    /* Personal */
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    profileImage: { type: String, default: "" },

    /* Vehicle */
    vehicle: {
      type: String,              // e.g. "Toyota Prius"
      plateNumber: String,
      image: String,             // vehicle image path
    },

    /* Verification */
    verification: {
      idNumber: { type: String, trim: true, default: "" },
      idImage: { type: String, default: "" }, // id image path

      status: {
        type: String,
        enum: ["draft", "pending", "verified", "rejected"],
        default: "draft",
        index: true,
      },
      rejectReason: { type: String, default: "" },

      verifiedAt: { type: Date, default: null },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },

    /* Account */
    email: { type: String, trim: true, lowercase: true, default: "" },
    hasAccount: { type: Boolean, default: false },

    /* Live status (for card badges) */
    status: {
      type: String,
      enum: ["offline", "online", "on_trip", "suspended"],
      default: "offline",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Driver", DriverSchema);
