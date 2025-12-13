// server/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* =====================================================
   🧩 ROLE-BASED ACCESS CONTROL
===================================================== */
export const ROLES_LIST = [
  "superadmin",
  "company",
  "manager",
  "driver",
  "customer",
];

/* =====================================================
   🧩 USER SCHEMA
===================================================== */
const userSchema = new mongoose.Schema(
  {
    /* ===============================
       🔹 BASIC IDENTITY
    ================================ */
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // ✅ allow drivers without email
      unique: true,
    },

    passwordHash: {
      type: String,
      select: false, // never return by default
    },

    role: {
      type: String,
      enum: ROLES_LIST,
      required: true,
      index: true,
    },

    /* ===============================
       🟦 SYSTEM OWNER
    ================================ */
    isSystemOwner: { type: Boolean, default: false },
    systemAccessLevel: { type: Number, default: 3 },

    /* ===============================
       🏢 COMPANY RELATION
    ================================ */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
      default: null,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ===============================
       👤 PROFILE INFO
    ================================ */
    profileImage: { type: String, default: "" },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },

    /* ===============================
       🚚 DRIVER OPERATIONAL DATA
    ================================ */
    driverStatus: {
      type: String,
      enum: ["offline", "available", "on_trip"],
      default: "offline",
    },

    totalTripsCompleted: { type: Number, default: 0 },
    driverOrdersCount: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },

    vehicleAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    /* ===============================
       🛂 DRIVER VERIFICATION
    ================================ */
    driverVerificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },

    driverVerification: {
      idNumber: { type: String, trim: true },
      idImage: { type: String, default: "" },

      vehicleImage: { type: String, default: "" },
      vehiclePlateNumber: { type: String, trim: true },

      verifiedAt: { type: Date },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      rejectionReason: { type: String, default: "" },
    },

    /* ===============================
       🧭 DRIVER ONBOARDING FLOW
       (IMPORTANT FOR SUBSCRIPTIONS)
    ================================ */
    driverOnboardingStage: {
      type: String,
      enum: ["profile_only", "verified", "account_created"],
      default: "profile_only",
      index: true,
    },

    /* ===============================
       ⚙️ ACCOUNT STATUS
    ================================ */
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* =====================================================
   🔐 PASSWORD CHECK
===================================================== */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

/* =====================================================
   🧠 VIRTUALS
===================================================== */
userSchema.virtual("canLogin").get(function () {
  return (
    this.role === "driver" &&
    this.driverOnboardingStage === "account_created" &&
    !!this.passwordHash
  );
});

userSchema.virtual("isVerifiedDriver").get(function () {
  return this.driverVerificationStatus === "verified";
});

/* =====================================================
   📦 EXPORT
===================================================== */
const User = mongoose.model("User", userSchema);
export default User;
