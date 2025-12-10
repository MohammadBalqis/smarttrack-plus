// server/src/models/DriverNotification.js
import mongoose from "mongoose";

const driverNotificationSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("DriverNotification", driverNotificationSchema);
