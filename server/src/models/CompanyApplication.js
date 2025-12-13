import mongoose from "mongoose";

const companyApplicationSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    ownerName: { type: String, required: true },

   companyEmail: {
  type: String,
  required: true,
  lowercase: true,
  trim: true,
},

    passwordHash: { type: String, required: true },

    phone: String,
    address: String,

    // ⛔ NO ENUM HERE
    businessCategory: { type: String },
    businessCategoryOther: { type: String },

    commercialRegistrationNumber: { type: String, required: true },

    documentUrl: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewNote: String,

    createdCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    createdUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CompanyApplication", companyApplicationSchema);
