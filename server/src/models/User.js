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
      sparse: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      select: false,
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
       🏢 COMPANY / SHOP RELATION
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
      index: true,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /* ===============================
       🧾 CREATION META
    ================================ */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    createdVia: {
      type: String,
      enum: ["self", "manager", "company", "system"],
      default: "system",
      index: true,
    },

    /* ===============================
       👤 PROFILE INFO
    ================================ */
    profileImage: { type: String, default: "" },

    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true, // ✅ REQUIRED for customer login
    },

    address: { type: String, trim: true },

    /* ===============================
       🚚 DRIVER RUNTIME STATE
    ================================ */
    driverStatus: {
      type: String,
      enum: ["offline", "online", "paused", "in_trip", "available", "on_trip"],
      default: "offline",
      index: true,
    },

    lastSeenAt: { type: Date, default: null },
    lastStatusAt: { type: Date, default: null },

    currentLat: { type: Number, default: null, index: true },
    currentLng: { type: Number, default: null, index: true },
    locationUpdatedAt: { type: Date, default: null },

    currentTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
      index: true,
    },

    vehicleAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
      index: true,
    },

    /* ===============================
       🚫 DRIVER SUSPENSION
    ================================ */
    isSuspended: { type: Boolean, default: false, index: true },
    suspendedReason: { type: String, default: "" },
    suspendedAt: { type: Date, default: null },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ===============================
       📈 DRIVER METRICS
    ================================ */
    totalTripsCompleted: { type: Number, default: 0 },
    driverOrdersCount: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },

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

      submittedAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

      rejectedAt: { type: Date, default: null },
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rejectionReason: { type: String, default: "" },

      reverifyRequestedAt: { type: Date, default: null },
      reverifyReason: { type: String, default: "" },
    },

    driverOnboardingStage: {
      type: String,
      enum: [
        "profile_only",
        "verified",
        "account_created",
        "profile_created",
        "documents_submitted",
      ],
      default: "profile_only",
      index: true,
    },

    /* ===============================
       🧑‍💼 MANAGER VERIFICATION
    ================================ */
    managerVerificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },

    managerVerification: {
      idNumber: { type: String, trim: true },
      idImage: { type: String, default: "" },

      verifiedAt: { type: Date, default: null },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

      rejectedAt: { type: Date, default: null },
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rejectionReason: { type: String, default: "" },
    },

    managerOnboardingStage: {
      type: String,
      enum: ["profile_only", "verified", "account_created"],
      default: "profile_only",
      index: true,
    },

    /* ===============================
       ⚙️ ACCOUNT STATUS
    ================================ */
    isActive: { type: Boolean, default: true, index: true },
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

// Driver login rule
userSchema.virtual("canDriverLogin").get(function () {
  return (
    this.role === "driver" &&
    this.driverOnboardingStage === "account_created" &&
    !!this.passwordHash &&
    this.isActive &&
    !this.isSuspended
  );
});

// Manager login rule
userSchema.virtual("canManagerLogin").get(function () {
  return (
    this.role === "manager" &&
    this.managerOnboardingStage === "account_created" &&
    !!this.passwordHash &&
    this.isActive
  );
});

// ✅ CUSTOMER LOGIN RULE (NEW)
userSchema.virtual("canCustomerLogin").get(function () {
  return (
    this.role === "customer" &&
    !!this.phone &&
    !!this.passwordHash &&
    this.isActive
  );
});

userSchema.virtual("isVerifiedDriver").get(function () {
  return this.driverVerificationStatus === "verified";
});

userSchema.virtual("isVerifiedManager").get(function () {
  return this.managerVerificationStatus === "verified";
});

/* =====================================================
   📦 EXPORT
===================================================== */
const User = mongoose.model("User", userSchema);
export default User;
