// server/src/routes/superAdminUserRoutes.js
import { Router } from "express";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import Payment from "../models/Payment.js";
import Vehicle from "../models/Vehicle.js";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();
const superAdminOnly = [protect, authorizeRoles("superadmin")];

/* ==========================================================
   1) LIST ALL USERS (Paginated)
   GET /api/superadmin/users?page=1&limit=20&role=driver
========================================================== */
router.get("/", superAdminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};

    if (role) filter.role = role;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .select("-passwordHash"),
    ]);

    res.json({
      ok: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (err) {
    console.error("❌ List users error:", err.message);
    res.status(500).json({ error: "Server error listing users" });
  }
});

/* ==========================================================
   2) GET FULL USER PROFILE (deep data)
   GET /api/superadmin/users/:id
========================================================== */
router.get("/:id", superAdminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });

    const companyId =
      user.role === "company"
        ? user._id
        : user.companyId
        ? user.companyId
        : null;

    let drivers = [];
    let trips = [];
    let payments = [];

    if (companyId) {
      drivers = await User.find({ companyId, role: "driver" }).select(
        "name email isActive"
      );

      trips = await Trip.find({ companyId })
        .populate("driverId", "name")
        .populate("customerId", "name")
        .sort({ createdAt: -1 });

      payments = await Payment.find({ companyId }).sort({ createdAt: -1 });
    }

    res.json({
      ok: true,
      user,
      related: {
        drivers,
        trips,
        payments,
      },
    });
  } catch (err) {
    console.error("❌ Get user error:", err.message);
    res.status(500).json({ error: "Server error fetching user" });
  }
});

/* ==========================================================
   3) UPDATE USER FIELDS  
   PATCH /api/superadmin/users/:id
========================================================== */
router.patch("/:id", superAdminOnly, async (req, res) => {
  try {
    const updates = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-passwordHash");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      ok: true,
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    console.error("❌ Update user error:", err.message);
    res.status(500).json({ error: "Server error updating user" });
  }
});

/* ==========================================================
   4) CHANGE USER ROLE
   PATCH /api/superadmin/users/:id/role
========================================================== */
router.patch("/:id/role", superAdminOnly, async (req, res) => {
  try {
    const { newRole } = req.body;
    if (!newRole)
      return res.status(400).json({ error: "newRole is required" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = newRole;
    await user.save();

    res.json({
      ok: true,
      message: "Role updated",
      user,
    });
  } catch (err) {
    console.error("❌ Role update error:", err.message);
    res.status(500).json({ error: "Server error updating role" });
  }
});

/* ==========================================================
   5) TOGGLE USER ACTIVE STATUS
   PATCH /api/superadmin/users/:id/toggle
========================================================== */
router.patch("/:id/toggle", superAdminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      ok: true,
      message: `User is now ${user.isActive ? "active" : "suspended"}`,
      user,
    });
  } catch (err) {
    console.error("❌ Toggle error:", err.message);
    res.status(500).json({ error: "Server error toggling user" });
  }
});

/* ==========================================================
   6) RESET USER PASSWORD
   PATCH /api/superadmin/users/:id/reset-password
========================================================== */
router.patch("/:id/reset-password", superAdminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        error: "Password must be at least 4 characters",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      ok: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("❌ Reset password error:", err.message);
    res.status(500).json({ error: "Server error resetting password" });
  }
});

/* ==========================================================
   7) DELETE USER (safe)
   DELETE /api/superadmin/users/:id
========================================================== */
router.delete("/:id", superAdminOnly, async (req, res) => {
  try {
    const userId = req.params.id;

    // Clean relations
    await Trip.updateMany({ driverId: userId }, { driverId: null });
    await Trip.updateMany({ customerId: userId }, { customerId: null });
    await Trip.updateMany({ companyId: userId }, { companyId: null });

    await Payment.deleteMany({ driverId: userId });
    await Payment.deleteMany({ customerId: userId });
    await Payment.deleteMany({ companyId: userId });

    await User.findByIdAndDelete(userId);

    res.json({
      ok: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete user error:", err.message);
    res.status(500).json({ error: "Server error deleting user" });
  }
});

export default router;
