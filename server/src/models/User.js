import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* =====================================================
   🧩 ALLOWED ROLES — RBAC Hierarchy
   ===================================================== */
export const ROLES_LIST = ["owner", "company", "manager", "driver", "customer"];

const userSchema = new mongoose.Schema(
  {
    // 🔹 Core Info
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // 🔐 Security
    passwordHash: { type: String, required: true },

    // 🎭 Role Management
    role: { type: String, enum: ROLES_LIST, required: true, index: true },

    // 🏢 Company association (used by manager/driver)
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // refers to the company user
      default: null,
    },

    // 👨‍💼 Manager association (used by drivers)
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // refers to the manager user
      default: null,
    },

    // 🏷️ Optional Company Info (only for company accounts)
    companyName: { type: String, trim: true },

    // 🖼️ Driver / User profile image
    profileImage: { type: String, default: null }, // e.g. /uploads/drivers/face.jpg

    // 🚚 Number of currently active orders for drivers
    driverOrdersCount: { type: Number, default: 0 },

        // 📝 Optional notes from company/manager about driver
    driverNotes: { type: String, trim: true },

    // ⚙️ Status
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* =====================================================
   🔐 Compare Password
   ===================================================== */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

/* =====================================================
   ✅ Export Model
   ===================================================== */
const User = mongoose.model("User", userSchema);
export default User;
