// server/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* =====================================================
   🧩 ROLE-BASED ACCESS CONTROL (RBAC)
   ===================================================== */
export const ROLES_LIST = [
  "superadmin",   // Full system access
  "company",      // Company owner / company account
  "manager",      // Works under company
  "driver",       // Works under manager or company
  "customer",     // End user requesting delivery
];

/* =====================================================
   🧩 USER SCHEMA
   ===================================================== */
const userSchema = new mongoose.Schema(
  {
    /* -------------------------------
       🔹 BASIC INFO
    --------------------------------*/
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: { type: String, required: true },

    /* -------------------------------
       🎭 USER ROLE
    --------------------------------*/
    role: {
      type: String,
      enum: ROLES_LIST,
      required: true,
      index: true,
    },

    /* =====================================================
         🏰 SUPERADMIN PROPERTIES
       ===================================================== */
    isSystemOwner: {
      type: Boolean,
      default: false,
    },

    systemAccessLevel: {
      type: Number,        // 1 = view, 2 = edit, 3 = full access
      default: 3,
      min: 1,
      max: 3,
    },

    /* =====================================================
       🏢 COMPANY & TEAM RELATIONS
       ===================================================== */

    // Used by MANAGER and DRIVER
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Used only by DRIVER
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Only for company accounts
    companyName: { type: String, trim: true },

    /* =====================================================
       👤 PROFILE INFO
       ===================================================== */
    profileImage: { type: String, default: null },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },

    /* =====================================================
       🚚 DRIVER-SPECIFIC FIELDS
       ===================================================== */

    // Driver availability
    driverStatus: {
      type: String,
      enum: ["offline", "available", "on_trip"],
      default: "offline",
    },

    // Driver ratings
    driverRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },

    // Live GPS tracking
    currentLat: { type: Number, default: null },
    currentLng: { type: Number, default: null },

    // Performance metrics
    totalTripsCompleted: { type: Number, default: 0 },
    driverOrdersCount: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },

    // Optional assigned vehicle
    vehicleAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    // Driver notes (company writes about driver)
    driverNotes: { type: String, trim: true },

    /* =====================================================
       🟦 MANAGER-SPECIFIC FIELDS
       ===================================================== */
    managerDepartment: { type: String, trim: true },
    managerNotes: { type: String, trim: true },
    managerPermissions: { type: Array, default: [] },

    /* =====================================================
       ⚙️ ACCOUNT STATUS
       ===================================================== */
    isActive: { type: Boolean, default: true },
  },

  { timestamps: true }
);

/* =====================================================
   🔐 COMPARE PASSWORD
   ===================================================== */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

/* =====================================================
   🧠 VIRTUAL: SUPERADMIN CHECK
   ===================================================== */
userSchema.virtual("isSuperAdmin").get(function () {
  return this.role === "superadmin";
});

/* =====================================================
   📦 EXPORT MODEL
   ===================================================== */
const User = mongoose.model("User", userSchema);
export default User;
