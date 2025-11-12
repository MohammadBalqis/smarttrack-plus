import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

/* =========================================================
   🟢 AUTHENTICATION ROUTES
   ========================================================= */
router.post("/register", register);
router.post("/login", login);

/* =========================================================
   🟡 GENERIC PROTECTED PROFILE
   ========================================================= */
router.get("/profile", protect, (req, res) => {
  res.json({
    ok: true,
    message: "Welcome to your profile!",
    user: req.user,
  });
});

/* =========================================================
   🔵 ROLE-BASED DASHBOARDS
   ========================================================= */

// 🟠 Owner Dashboard — full system access
router.get("/owner-dashboard", protect, authorizeRoles("owner"), (req, res) => {
  res.json({
    ok: true,
    dashboard: "Owner Dashboard",
    message: "Welcome System Owner — you have full access to all data.",
    role: req.user.role,
  });
});

// 🟣 Company Dashboard — restricted to company role
router.get("/company-dashboard", protect, authorizeRoles("company"), (req, res) => {
  res.json({
    ok: true,
    dashboard: "Company Dashboard",
    message: "Welcome Company — you can manage your managers and drivers.",
    role: req.user.role,
  });
});

// 🔵 Manager Dashboard — for managers & company accounts
router.get(
  "/manager-dashboard",
  protect,
  authorizeRoles("manager", "company"),
  (req, res) => {
    res.json({
      ok: true,
      dashboard: "Manager Dashboard",
      message: "Welcome Manager — you can view and manage your assigned drivers.",
      role: req.user.role,
    });
  }
);

// 🟢 Driver Dashboard — for drivers, managers, and company
router.get(
  "/driver-dashboard",
  protect,
  authorizeRoles("driver", "manager", "company"),
  (req, res) => {
    res.json({
      ok: true,
      dashboard: "Driver Dashboard",
      message: "Welcome Driver — view your assigned routes and company info.",
      role: req.user.role,
    });
  }
);

/* =========================================================
   🧩 COMPANY CREATES TEAM MEMBERS (Manager / Driver)
   ========================================================= */
router.post(
  "/company/create-user",
  protect,
  authorizeRoles("company"),
  async (req, res) => {
    try {
      const { name, email, password, role, managerId } = req.body;

      // Validation
      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Prevent duplicates
      const existing = await User.findOne({ email });
      if (existing)
        return res.status(409).json({ error: "Email already registered" });

      // Company can only create manager or driver
      if (!["manager", "driver"].includes(role)) {
        return res
          .status(403)
          .json({ error: "Invalid role. Only 'manager' or 'driver' allowed." });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Create new user under the company
      const newUser = await User.create({
        name,
        email,
        passwordHash,
        role,
        companyId: req.user._id,
        managerId: managerId || null,
      });

      // Optional JWT for new user
      const token = jwt.sign(
        { uid: newUser._id, role: newUser.role, companyId: newUser.companyId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        ok: true,
        message: `${role} created successfully under company.`,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          companyId: newUser.companyId,
          managerId: newUser.managerId,
        },
        token,
      });
    } catch (err) {
      console.error("Company create-user error:", err.message);
      res
        .status(500)
        .json({ error: "Server error while creating team member" });
    }
  }
);

/* =========================================================
   ✅ EXPORT ROUTER
   ========================================================= */
export default router;
