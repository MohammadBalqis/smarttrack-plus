import bcrypt from "bcryptjs";
import CompanyApplication from "../../models/CompanyApplication.js";
import User from "../../models/User.js";
import Company from "../../models/Company.js";
import { logActivity } from "../../utils/activityLogger.js";

/* ==========================================================
   GET APPLICATIONS
========================================================== */
export const getCompanyApplications = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20, search = "" } = req.query;

    const query = {};
    if (status !== "all") query.status = status;

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { companyEmail: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
      ];
    }

    const p = Math.max(Number(page), 1);
    const l = Math.min(Math.max(Number(limit), 1), 50);

    const [applications, total] = await Promise.all([
      CompanyApplication.find(query)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l),
      CompanyApplication.countDocuments(query),
    ]);

    res.json({
      ok: true,
      applications,
      page: p,
      pages: Math.ceil(total / l),
      total,
    });
  } catch (err) {
    console.error("getCompanyApplications error:", err);
    res.status(500).json({ ok: false, error: "Failed to load applications" });
  }
};

/* ==========================================================
   GET APPLICATION BY ID
========================================================== */
export const getCompanyApplicationById = async (req, res) => {
  try {
    const app = await CompanyApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ ok: false, error: "Application not found" });
    }
    res.json({ ok: true, application: app });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to load application" });
  }
};

/* ==========================================================
   APPROVE APPLICATION ✅ FULLY FIXED
========================================================== */
export const approveCompanyApplication = async (req, res) => {
  try {
    const app = await CompanyApplication.findById(req.params.id);

    if (!app) {
      return res.status(404).json({ ok: false, error: "Application not found" });
    }

    if (app.status === "approved") {
      return res.json({ ok: true, message: "Already approved" });
    }

    /* ======================================================
       1️⃣ CREATE / FIND COMPANY OWNER USER
    ====================================================== */
    let user = await User.findOne({ email: app.companyEmail });

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      user = await User.create({
        name: app.ownerName,
        email: app.companyEmail,
        passwordHash, // ✅ REQUIRED
        role: "company",
        isActive: true,
      });
    }

    /* ======================================================
       2️⃣ CREATE / FIND COMPANY
    ====================================================== */
    let company = await Company.findOne({
      $or: [{ ownerId: user._id }, { name: app.companyName }],
    });

    if (!company) {
      company = await Company.create({
        name: app.companyName,
        email: app.companyEmail,
        phone: app.phone || "",
        address: app.address || "",
        businessCategory: app.businessCategory || "other",
        businessCategoryCustom: app.businessCategoryOther || null,
        commercialRegistrationNumber: app.commercialRegistrationNumber,

        ownerId: user._id,

        // ✅ IMPORTANT FLAGS
        isActive: true,
        isApproved: true,
        billingStatus: "active",
        subscription: undefined, // DO NOT set null
      });
    }

    /* ======================================================
       3️⃣ LINK USER → COMPANY
    ====================================================== */
    if (!user.companyId) {
      user.companyId = company._id;
      await user.save();
    }

    /* ======================================================
       4️⃣ UPDATE APPLICATION
    ====================================================== */
    app.status = "approved";
    app.createdCompanyId = company._id;
    app.createdUserId = user._id;
    app.reviewedBy = req.user._id;
    app.reviewedAt = new Date();
    await app.save();

    /* ======================================================
       5️⃣ LOG ACTIVITY
    ====================================================== */
    await logActivity({
      userId: req.user._id,
      action: "COMPANY_APPLICATION_APPROVED",
      description: `Approved company ${company.name}`,
      ipAddress: req.ip,
      deviceInfo: req.headers["user-agent"],
    });

    return res.json({
      ok: true,
      message: "Company approved successfully",
      companyId: company._id,
    });
  } catch (err) {
    console.error("approveCompanyApplication error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Approval failed",
    });
  }
};

/* ==========================================================
   REJECT APPLICATION
========================================================== */
export const rejectCompanyApplication = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Rejection reason is required" });
    }

    const app = await CompanyApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ ok: false, error: "Application not found" });
    }

    app.status = "rejected";
    app.reviewedBy = req.user._id;
    app.reviewedAt = new Date();
    app.reviewNote = reason.trim();
    await app.save();

    res.json({ ok: true });
  } catch (err) {
    console.error("rejectCompanyApplication error:", err);
    res.status(500).json({ ok: false, error: "Reject failed" });
  }
};
