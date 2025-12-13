import CompanyApplication from "../../models/CompanyApplication.js";
import User from "../../models/User.js";
import Company from "../../models/Company.js";
import { logActivity } from "../../utils/activityLogger.js";

/* ==========================================================
   OWNER APPROVAL — COMPANY APPLICATIONS
========================================================== */

/* ==========================================================
   GET /api/owner/company-applications
========================================================== */
export const getCompanyApplications = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20, search = "" } = req.query;

    const query = {};
    if (status && status !== "all") query.status = status;

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { companyEmail: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
        { commercialRegistrationNumber: { $regex: search, $options: "i" } },
      ];
    }

    const p = Math.max(Number(page), 1);
    const l = Math.min(Math.max(Number(limit), 1), 50);

    const [items, total] = await Promise.all([
      CompanyApplication.find(query)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l),
      CompanyApplication.countDocuments(query),
    ]);

    res.json({
      ok: true,
      applications: items,
      page: p,
      limit: l,
      total,
      pages: Math.ceil(total / l),
    });
  } catch (err) {
    console.error("getCompanyApplications error:", err);
    res.status(500).json({ ok: false, error: "Failed to load applications." });
  }
};

/* ==========================================================
   GET /api/owner/company-applications/:id
========================================================== */
export const getCompanyApplicationById = async (req, res) => {
  try {
    const app = await CompanyApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ ok: false, error: "Application not found." });
    }

    res.json({ ok: true, application: app });
  } catch (err) {
    console.error("getCompanyApplicationById error:", err);
    res.status(500).json({ ok: false, error: "Failed to load application." });
  }
};

/* ==========================================================
   PATCH /api/owner/company-applications/:id/approve
========================================================== */
export const approveCompanyApplication = async (req, res) => {
  try {
    const { note = "Approved by system owner" } = req.body;

    const app = await CompanyApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ ok: false, error: "Application not found" });
    }

    if (app.status === "approved") {
      return res.json({ ok: true, message: "Already approved" });
    }

    /* ======================================================
       RESOLVE CATEGORY
    ====================================================== */
    const finalCategory =
      app.businessCategoryOther?.trim()
        ? "other"
        : app.businessCategory || "other";

    const customCategory =
      app.businessCategoryOther?.trim()
        ? app.businessCategoryOther.trim()
        : null;

    /* ======================================================
       FIND OR CREATE USER (EMAIL UNIQUE)
    ====================================================== */
    let user = await User.findOne({ email: app.companyEmail });

    if (!user) {
      user = await User.create({
        name: app.ownerName,
        email: app.companyEmail,
        passwordHash: app.passwordHash || "TEMP",
        role: "company",
        isActive: true,
      });
    }

    /* ======================================================
       FIND OR CREATE COMPANY (NAME UNIQUE)
    ====================================================== */
    let company = await Company.findOne({ name: app.companyName });

    if (!company) {
      company = await Company.create({
        name: app.companyName,
        email: app.companyEmail,
        phone: app.phone || "",
        address: app.address || "",
        businessCategory: finalCategory,
        businessCategoryCustom: customCategory,
        commercialRegistrationNumber: app.commercialRegistrationNumber,
        billingStatus: "active",
        isActive: true,
        ownerId: user._id,
      });
    }

    /* ======================================================
       LINK USER ↔ COMPANY
    ====================================================== */
    user.companyId = company._id;
    await user.save();

    /* ======================================================
       UPDATE APPLICATION
    ====================================================== */
    app.status = "approved";
    app.reviewedBy = req.user._id;
    app.reviewedAt = new Date();
    app.reviewNote = note;
    app.createdCompanyId = company._id;
    app.createdUserId = user._id;
    await app.save();

    /* ======================================================
       ACTIVITY LOG
    ====================================================== */
    await logActivity({
      userId: req.user._id,
      action: "COMPANY_APPLICATION_APPROVED",
      description: `Approved company: ${company.name} (${company.email})`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    res.json({
      ok: true,
      message: "Company approved successfully",
      companyId: company._id,
      userId: user._id,
    });
  } catch (err) {
    console.error("approveCompanyApplication error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Approval failed",
    });
  }
};

/* ==========================================================
   PATCH /api/owner/company-applications/:id/reject
========================================================== */
export const rejectCompanyApplication = async (req, res) => {
  try {
    const { reason = "" } = req.body;

    if (!reason.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Rejection reason is required." });
    }

    const app = await CompanyApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ ok: false, error: "Application not found." });
    }

    if (app.status === "rejected") {
      return res.json({ ok: true, message: "Already rejected." });
    }

    app.status = "rejected";
    app.reviewedBy = req.user._id;
    app.reviewedAt = new Date();
    app.reviewNote = reason.trim();
    await app.save();

    await logActivity({
      userId: req.user._id,
      action: "COMPANY_APPLICATION_REJECTED",
      description: `Rejected company application: ${app.companyName} (${app.companyEmail}) — ${reason}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    res.json({
      ok: true,
      message: "Company application rejected.",
      application: app,
    });
  } catch (err) {
    console.error("rejectCompanyApplication error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Failed to reject application.",
    });
  }
};
