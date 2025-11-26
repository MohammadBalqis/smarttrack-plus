// server/src/controllers/brandingController.js
import Branding from "../models/Branding.js";
import User from "../models/User.js";
import { resolveCompanyId } from "../utils/resolveCompanyId.js";

/* ==========================================================
   GET /api/company/branding
   📌 Get branding for the current company
   - Allowed: role "company" and "manager"
========================================================== */
export const getCompanyBranding = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    // Try to find existing branding doc
    const brandingDoc = await Branding.findOne({ companyId }).lean();

    // If no branding yet, build a default preview (without forcing insert)
    if (!brandingDoc) {
      // Get base company info to make nicer defaults
      const company = await User.findById(companyId)
        .select("name email")
        .lean()
        .catch(() => null);

      const defaultBranding = {
        companyId,
        companyDisplayName: company?.name || "Your Company Name",
        shortTagline: "Describe your services here.",
        logoUrl: "",
        coverUrl: "",
        primaryColor: "#1F2933",
        secondaryColor: "#F5F5F5",
        accentColor: "#2563EB",
        about: "",
        contactEmail: company?.email || "",
        contactPhone: "",
        website: "",
        addressLine: "",
        city: "",
        country: "",
        facebookUrl: "",
        instagramUrl: "",
        tiktokUrl: "",
        whatsappNumber: "",
        isPublic: true,
        meta: {},
        _isDefault: true, // just to know on frontend if needed
      };

      return res.json({
        ok: true,
        branding: defaultBranding,
      });
    }

    res.json({
      ok: true,
      branding: brandingDoc,
    });
  } catch (err) {
    console.error("❌ getCompanyBranding error:", err.message);
    res.status(500).json({ error: "Server error fetching branding" });
  }
};

/* ==========================================================
   PUT /api/company/branding
   🎨 Update branding (company owner only)
========================================================== */
export const updateCompanyBranding = async (req, res) => {
  try {
    // Only company owner can edit branding
    if (req.user.role !== "company") {
      return res.status(403).json({
        error: "Only company owners can update branding.",
      });
    }

    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    // Extract only allowed fields from body (to avoid junk)
    const {
      companyDisplayName,
      shortTagline,
      logoUrl,
      coverUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      about,
      contactEmail,
      contactPhone,
      website,
      addressLine,
      city,
      country,
      facebookUrl,
      instagramUrl,
      tiktokUrl,
      whatsappNumber,
      isPublic,
      meta,
    } = req.body;

    const payload = {
      companyId,
      companyDisplayName,
      shortTagline,
      logoUrl,
      coverUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      about,
      contactEmail,
      contactPhone,
      website,
      addressLine,
      city,
      country,
      facebookUrl,
      instagramUrl,
      tiktokUrl,
      whatsappNumber,
      isPublic,
      meta,
    };

    // Remove undefined fields so we don't overwrite accidentally
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const branding = await Branding.findOneAndUpdate(
      { companyId },
      { $set: payload },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    res.json({
      ok: true,
      message: "Branding updated successfully.",
      branding,
    });
  } catch (err) {
    console.error("❌ updateCompanyBranding error:", err.message);
    res.status(500).json({ error: "Server error updating branding" });
  }
};
