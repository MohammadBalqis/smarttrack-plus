// server/src/routes/customerCompanyRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Company from "../models/Company.js";

const router = Router();

/* ==========================================================
   🟣 1. GET ALL COMPANIES (Customer can order from)
   GET /api/customer/companies
========================================================== */
router.get(
  "/companies",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const companies = await Company.find({
        isActive: true,
        isApproved: true,
      }).select("name logo businessCategory");

      return res.json({
        ok: true,
        companies,
      });
    } catch (err) {
      console.error("❌ getCustomerCompanies error:", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to load companies",
      });
    }
  }
);

/* ==========================================================
   🟢 2. CUSTOMER SELECTS COMPANY
   POST /api/customer/select-company
   Body: { companyId }
========================================================== */
router.post(
  "/select-company",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const { companyId } = req.body;

      if (!companyId) {
        return res.status(400).json({
          ok: false,
          error: "companyId is required",
        });
      }

      const company = await Company.findOne({
        _id: companyId,
        isActive: true,
        isApproved: true,
      });

      if (!company) {
        return res.status(404).json({
          ok: false,
          error: "Company not found or not available",
        });
      }

      // Save selected company on customer
      req.user.companyId = company._id;
      await req.user.save();

      return res.json({
        ok: true,
        message: "Company selected successfully",
        company: {
          _id: company._id,
          name: company.name,
          logo: company.logo,
          businessCategory: company.businessCategory,
        },
      });
    } catch (err) {
      console.error("❌ selectCustomerCompany error:", err);
      return res.status(500).json({
        ok: false,
        error: "Server error selecting company",
      });
    }
  }
);

/* ==========================================================
   🟡 3. GET CUSTOMER ACTIVE COMPANY
   GET /api/customer/active-company
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
          company: null,
        });
      }

      const company = await Company.findOne({
        _id: req.user.companyId,
        isActive: true,
        isApproved: true,
      }).select("name logo businessCategory");

      if (!company) {
        // Company removed / deactivated
        req.user.companyId = null;
        await req.user.save();

        return res.json({
          ok: false,
          company: null,
        });
      }

      return res.json({
        ok: true,
        company,
      });
    } catch (err) {
      console.error("❌ getActiveCustomerCompany error:", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to load active company",
      });
    }
  }
);

export default router;
