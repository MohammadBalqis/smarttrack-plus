// server/src/routes/brandingRoutes.js
import { Router } from "express";
import Company from "../models/Company.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { logActivity } from "../utils/activityLogger.js";

const router = Router();

/* ==========================================================
   🟦 1. Get Branding Settings
   company / manager / owner / superadmin
========================================================== */
router.get(
  "/get",
  protect,
  authorizeRoles("company", "manager", "owner", "superadmin"),
  async (req, res) => {
    try {
      let company;

      if (req.user.role === "company") {
        company = await Company.findById(req.user._id).select("branding");
      } else if (req.user.role === "manager") {
        company = await Company.findById(req.user.companyId).select("branding");
      } else {
        company = await Company.findById(req.query.companyId).select("branding");
      }

      if (!company) {
        return res.status(404).json({ error: "Company branding not found" });
      }

      res.json({ ok: true, branding: company.branding });
    } catch (err) {
      res.status(500).json({ error: "Server error loading branding" });
    }
  }
);

/* ==========================================================
   🟦 2. Update Branding Settings
   Only: company, owner, superadmin
========================================================== */
router.patch(
  "/update",
  protect,
  authorizeRoles("company", "owner", "superadmin"),
  async (req, res) => {
    try {
      let companyId;

      if (req.user.role === "company") companyId = req.user._id;
      else companyId = req.body.companyId;

      if (!companyId)
        return res.status(400).json({ error: "companyId required" });

      const updateFields = req.body.branding || {};

      const company = await Company.findByIdAndUpdate(
        companyId,
        { $set: { branding: updateFields }},
        { new: true }
      );

      await logActivity({
        userId: req.user._id,
        action: "BRANDING_UPDATE",
        description: `Updated branding for company ${companyId}`,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
      });

      res.json({
        ok: true,
        message: "Branding updated",
        branding: company.branding,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error updating branding" });
    }
  }
);

export default router;
