// server/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* =====================================================
   🧩 ROLE-BASED ACCESS CONTROL (RBAC)
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
       🟦 SUPERADMIN / SYSTEM OWNER
    ===================================================== */
    isSystemOwner: { type: Boolean, default: false },
    systemAccessLevel: { type: Number, default: 3, min: 1, max: 3 },

    /* =====================================================
       🏢 COMPANY RELATIONS
    ===================================================== */
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
      index: true,
    },

    companyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
    ],

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    companyName: { type: String, trim: true },

    /* =====================================================
       🧾 COMPANY BILLING SETTINGS
    ===================================================== */
    commissionDeliveryPercentage: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    commissionProductPercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    enableProductCommission: { type: Boolean, default: false },
    enableProductSales: { type: Boolean, default: true },
// ... داخل userSchema fields

/* =====================================================
   🏢 COMPANY APPROVAL (System Owner)
===================================================== */
companyStatus: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: null, // only used for role=company
  index: true,
},

companyApproval: {
  approvedAt: { type: Date, default: null },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  rejectionReason: { type: String, default: "" },
},

/* Company registration document (1 doc) */
companyVerificationDoc: {
  fileName: { type: String, default: "" },
  fileUrl: { type: String, default: "" }, // later you can replace with multer upload
},
  
    /* =====================================================
       👤 PROFILE INFO
    ===================================================== */
    profileImage: { type: String, default: null },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },

    /* =====================================================
       🚚 DRIVER-SPECIFIC FIELDS
    ===================================================== */
    driverStatus: {
      type: String,
      enum: ["offline", "available", "on_trip"],
      default: "offline",
    },

    driverRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },

    currentLat: { type: Number, default: null },
    currentLng: { type: Number, default: null },

    totalTripsCompleted: { type: Number, default: 0 },
    driverOrdersCount: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },

    vehicleAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    driverNotes: { type: String, trim: true },

    /* =====================================================
       🎨 BRANDING FOR COMPANY & MANAGERS
    ===================================================== */
    branding: {
      companyDisplayName: { type: String, default: "" },
      shortTagline: { type: String, default: "" },

      logoUrl: { type: String, default: "" },
      coverUrl: { type: String, default: "" },

      primaryColor: { type: String, default: "#2563EB" },
      secondaryColor: { type: String, default: "#1F2937" },
      accentColor: { type: String, default: "#10B981" },

      contactEmail: { type: String, default: "" },
      contactPhone: { type: String, default: "" },

      website: { type: String, default: "" },
      addressLine: { type: String, default: "" },
      city: { type: String, default: "" },
      country: { type: String, default: "" },

      facebookUrl: { type: String, default: "" },
      instagramUrl: { type: String, default: "" },
      tiktokUrl: { type: String, default: "" },
      whatsappNumber: { type: String, default: "" },

      about: { type: String, default: "" },
      isPublic: { type: Boolean, default: true },
      meta: { type: Object, default: {} },
    },

    /* =====================================================
       🟦 MANAGER-SPECIFIC FIELDS
    ===================================================== */
    managerDepartment: { type: String, trim: true },
    managerNotes: { type: String, trim: true },
    managerPermissions: { type: Array, default: [] },

    /* =====================================================
       🟩 CUSTOMER FIELDS
    ===================================================== */
    customerNotes: { type: String, trim: true },
    customerRating: { type: Number, default: 0 },

    customerDocuments: [
      {
        fileName: { type: String },
        filePath: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    isCustomerVerified: { type: Boolean, default: false },

    /* =====================================================
       ⚙️ ACCOUNT STATUS
    ===================================================== */
    isActive: { type: Boolean, default: true },
  },

  { timestamps: true }
);

/* =====================================================
   🔐 PASSWORD CHECK
===================================================== */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

/* =====================================================
   🧠 VIRTUAL CHECKERS
===================================================== */
userSchema.virtual("isSuperAdmin").get(function () {
  return this.role === "superadmin";
});

/* =====================================================
   📦 EXPORT
===================================================== */
const User = mongoose.model("User", userSchema);
export default User;
