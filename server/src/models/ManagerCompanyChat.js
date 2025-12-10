import mongoose from "mongoose";

const ManagerCompanyChatSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderType: {
      type: String,
      enum: ["company", "manager"],
      required: true,
    },

    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("ManagerCompanyChat", ManagerCompanyChatSchema);
