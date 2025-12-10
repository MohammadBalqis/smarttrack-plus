// server/src/models/SupportMessage.js
import mongoose from "mongoose";

const SupportMessageSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic text message from customer
    message: { type: String, required: true, trim: true },

    // Optional references if later you want link to trip/order
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

    status: {
      type: String,
      enum: ["open", "reviewed", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SupportMessage", SupportMessageSchema);
