// server/src/controllers/companyBrandingController.js
import User from "../models/User.js";
import Brand from "../models/Brand.js"; 
import { resolveCompanyId } from "../utils/resolveCompanyId.js";
import path from "path";
import fs from "fs";

/* ==========================================================
   GET COMPANY BRANDING
========================================================== */
export const getCompanyBranding = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) return res.status(400).json({ error: "CompanyId missing" });

    let brand = await Brand.findOne({ companyId }).lean();

    if (!brand) {
      // Create a default empty branding object
      brand = await Brand.create({ companyId });
      brand = brand.toObject();
    }

    res.json({ ok: true, brand });
  } catch (err) {
    console.error("❌ getCompanyBranding error:", err);
    res.status(500).json({ error: "Server error fetching branding" });
  }
};

/* ==========================================================
   UPDATE COMPANY BRANDING (General info)
========================================================== */
export const updateCompanyBranding = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) return res.status(400).json({ error: "CompanyId missing" });

    const data = req.body;

    const updated = await Brand.findOneAndUpdate(
      { companyId },
      { $set: data },
      { new: true, upsert: true }
    );

    res.json({ ok: true, brand: updated });
  } catch (err) {
    console.error("❌ updateCompanyBranding error:", err);
    res.status(500).json({ error: "Server error updating branding" });
  }
};

/* ==========================================================
   UPLOAD LOGO / COVER IMAGE
========================================================== */
export const uploadBrandingImage = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) return res.status(400).json({ error: "CompanyId missing" });

    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const fileUrl = `/uploads/${req.file.filename}`;

    const { type } = req.body; // "logo" or "cover"
    if (!["logo", "cover"].includes(type))
      return res.status(400).json({ error: "Invalid type" });

    const updateField = type === "logo" ? "logoUrl" : "coverUrl";

    const updated = await Brand.findOneAndUpdate(
      { companyId },
      { [updateField]: fileUrl },
      { new: true, upsert: true }
    );

    res.json({
      ok: true,
      message: `${type} updated successfully`,
      url: fileUrl,
      brand: updated,
    });
  } catch (err) {
    console.error("❌ uploadBrandingImage error:", err);
    res.status(500).json({ error: "File upload failed" });
  }
};
