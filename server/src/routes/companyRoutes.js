import { Router } from "express";
import Company from "../models/Company.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🏢 CREATE COMPANY — OWNER ONLY
   ========================================================== */
router.post("/create", protect, authorizeRoles("owner"), async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email)
      return res.status(400).json({ error: "Company name and email are required" });

    // prevent duplicates
    const existing = await Company.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Company already exists" });

    const company = await Company.create({
      name,
      email,
      phone,
      address,
      ownerId: req.user._id,
    });

    res.status(201).json({
      ok: true,
      message: "Company created successfully",
      company,
    });

    console.log(`✅ Company created by owner: ${req.user.email}`);
  } catch (err) {
    console.error("❌ Error creating company:", err.message);
    res.status(500).json({ error: "Server error creating company" });
  }
});

export default router;
