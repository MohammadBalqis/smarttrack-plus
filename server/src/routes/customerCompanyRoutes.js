import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Company from "../models/Company.js";
import User from "../models/User.js";

const router = Router();

/* ==========================================================
   🟣 1. GET ALL COMPANIES (Public - Login Required)
   ========================================================== */
router.get(
  "/companies",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const companies = await Company.find({})
        .select("name email phone address");

      res.json({
        ok: true,
        count: companies.length,
        companies,
      });
    } catch (err) {
      console.error("❌ Error listing companies:", err.message);
      res.status(500).json({ error: "Error fetching companies" });
    }
  }
);

/* ==========================================================
   🟢 2. CUSTOMER SELECTS COMPANY
   ========================================================== */
router.post(
  "/select-company",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const { companyId } = req.body;

      if (!companyId)
        return res.status(400).json({ error: "companyId is required" });

      const companyExists = await Company.findById(companyId);
      if (!companyExists)
        return res.status(404).json({ error: "Company not found" });

      // Update customer profile
      req.user.companyId = companyId;
      await req.user.save();

      res.json({
        ok: true,
        message: "Company selected successfully",
        company: companyExists,
      });
    } catch (err) {
      console.error("❌ Error selecting company:", err.message);
      res.status(500).json({ error: "Server error selecting company" });
    }
  }
);

/* ==========================================================
   🟡 3. GET CUSTOMER'S ACTIVE COMPANY
   ========================================================== */
router.get(
  "/active-company",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      if (!req.user.companyId) {
        return res.json({
          ok: false,
          message: "Customer has not selected a company yet",
        });
      }

      const company = await Company.findById(req.user.companyId)
        .select("name email phone address");

      res.json({
        ok: true,
        company,
      });
    } catch (err) {
      console.error("❌ Error fetching active company:", err.message);
      res.status(500).json({ error: "Server error fetching active company" });
    }
  }
);

export default router;
