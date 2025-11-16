import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    role: { type: String, default: "unknown" },

    action: { type: String, required: true }, 
    description: { type: String },

    ip: { type: String },
    userAgent: { type: String },

    // Optional relation to trip/payment/company
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("ActivityLog", activityLogSchema);
