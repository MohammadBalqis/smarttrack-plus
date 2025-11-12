import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   👨‍💼  CREATE MANAGER — COMPANY ONLY
   ========================================================== */
router.post("/create", protect, authorizeRoles("company"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing required fields" });

    // prevent duplicate email
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);

    // link manager to the company that is creating it
    const manager = await User.create({
      name,
      email,
      passwordHash,
      role: "manager",
      companyId: req.user.companyId || req.user._id, // fallback to self
    });

    res.status(201).json({
      ok: true,
      message: "Manager account created successfully",
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        companyId: manager.companyId,
      },
    });

    console.log(`✅ Manager created by company: ${req.user.email}`);
  } catch (err) {
    console.error("❌ Error creating manager:", err.message);
    res.status(500).json({ error: "Server error creating manager" });
  }
});

export default router;
