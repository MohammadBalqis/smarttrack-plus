// server/src/controllers/companyManagerController.js

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Shop from "../models/Shop.js";

/* ==========================================================
   Helpers
========================================================== */
const sanitize = (v) => (typeof v === "string" ? v.trim() : v);

const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  return user.companyId || null;
};

const ensureManagerInCompany = async ({ companyId, managerId }) => {
  return User.findOne({
    _id: managerId,
    role: "manager",
    companyId,
  });
};

/* ==========================================================
   📋 GET ALL MANAGERS (COMPANY)
   GET /api/company/managers
========================================================== */
export const getCompanyManagers = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    const managers = await User.find({
      role: "manager",
      companyId,
    })
      .select(
        "name email phone address shopId isActive " +
          "managerVerificationStatus managerOnboardingStage createdAt"
      )
      .populate("shopId", "name city")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      count: managers.length,
      managers,
    });
  } catch (err) {
    console.error("❌ getCompanyManagers ERROR:", err);
    res.status(500).json({ error: "Server error loading managers" });
  }
};

/* ==========================================================
   ➕ CREATE MANAGER PROFILE (NO LOGIN)
   POST /api/company/managers
========================================================== */
export const createCompanyManagerProfile = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { name, phone, address, shopId } = req.body;

    if (!sanitize(name)) {
      return res.status(400).json({ error: "Manager full name is required." });
    }

    const manager = await User.create({
      role: "manager",
      companyId,
      shopId: shopId || null,

      name: sanitize(name),
      phone: sanitize(phone),
      address: sanitize(address),

      managerOnboardingStage: "profile_only",
      managerVerificationStatus: "pending",
      isActive: true,
    });

    // Assign manager to shop if provided
    if (shopId) {
      await Shop.findOneAndUpdate(
        { _id: shopId, companyId },
        { managerId: manager._id }
      );
    }

    res.status(201).json({
      ok: true,
      message: "Manager profile created (no login yet).",
      manager,
    });
  } catch (err) {
    console.error("❌ createCompanyManagerProfile ERROR:", err);
    res.status(500).json({ error: "Server error creating manager profile" });
  }
};

/* ==========================================================
   ✏ UPDATE MANAGER PROFILE
   PATCH /api/company/managers/:managerId/profile
========================================================== */
export const updateCompanyManagerProfile = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { managerId } = req.params;

    const manager = await ensureManagerInCompany({ companyId, managerId });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    const { name, phone, address, shopId } = req.body;

    if (name !== undefined) manager.name = sanitize(name);
    if (phone !== undefined) manager.phone = sanitize(phone);
    if (address !== undefined) manager.address = sanitize(address);

    if (shopId !== undefined) {
      // Remove manager from previous shop
      await Shop.updateMany(
        { companyId, managerId: manager._id },
        { managerId: null }
      );

      manager.shopId = shopId || null;

      if (shopId) {
        await Shop.findOneAndUpdate(
          { _id: shopId, companyId },
          { managerId: manager._id }
        );
      }
    }

    await manager.save();

    res.json({
      ok: true,
      message: "Manager profile updated.",
      manager,
    });
  } catch (err) {
    console.error("❌ updateCompanyManagerProfile ERROR:", err);
    res.status(500).json({ error: "Server error updating manager profile" });
  }
};

/* ==========================================================
   🛂 SUBMIT / UPDATE MANAGER VERIFICATION
   PATCH /api/company/managers/:managerId/verification
========================================================== */
export const submitManagerVerification = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { managerId } = req.params;
    const { idNumber } = req.body;

const idImage =
  req.file ? `/uploads/managers/id/${req.file.filename}` : undefined;


    const manager = await ensureManagerInCompany({ companyId, managerId });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    manager.managerVerification = manager.managerVerification || {};

    if (idNumber !== undefined)
      manager.managerVerification.idNumber = sanitize(idNumber);
    if (idImage !== undefined)
      manager.managerVerification.idImage = sanitize(idImage);

    manager.managerVerificationStatus = "pending";
    manager.managerVerification.verifiedAt = null;
    manager.managerVerification.verifiedBy = null;
    manager.managerVerification.rejectionReason = "";

    if (manager.managerOnboardingStage !== "account_created") {
      manager.managerOnboardingStage = "profile_only";
    }

    await manager.save();

    res.json({
      ok: true,
      message: "Manager verification data submitted.",
      manager,
    });
  } catch (err) {
    console.error("❌ submitManagerVerification ERROR:", err);
    res.status(500).json({ error: "Server error saving verification data" });
  }
};

/* ==========================================================
   ✅ VERIFY MANAGER
   PATCH /api/company/managers/:managerId/verify
========================================================== */
export const verifyCompanyManager = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { managerId } = req.params;

    const manager = await ensureManagerInCompany({ companyId, managerId });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    const idNum = sanitize(manager.managerVerification?.idNumber);
    const idImg = sanitize(manager.managerVerification?.idImage);

    if (!idNum || !idImg) {
      return res.status(400).json({
        error: "idNumber and idImage are required to verify manager.",
      });
    }

    manager.managerVerificationStatus = "verified";
    manager.managerOnboardingStage =
      manager.managerOnboardingStage === "account_created"
        ? "account_created"
        : "verified";

    manager.managerVerification.verifiedAt = new Date();
    manager.managerVerification.verifiedBy = req.user._id;
    manager.managerVerification.rejectionReason = "";

    await manager.save();

    res.json({
      ok: true,
      message: "Manager verified successfully.",
      manager,
    });
  } catch (err) {
    console.error("❌ verifyCompanyManager ERROR:", err);
    res.status(500).json({ error: "Server error verifying manager" });
  }
};

/* ==========================================================
   ❌ REJECT MANAGER
========================================================== */
export const rejectCompanyManager = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { managerId } = req.params;
    const { reason = "" } = req.body;

    const manager = await ensureManagerInCompany({ companyId, managerId });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    manager.managerVerificationStatus = "rejected";
    manager.managerOnboardingStage = "profile_only";

    manager.managerVerification = manager.managerVerification || {};
    manager.managerVerification.rejectionReason = sanitize(reason);
    manager.managerVerification.verifiedAt = null;
    manager.managerVerification.verifiedBy = null;

    await manager.save();

    res.json({
      ok: true,
      message: "Manager rejected.",
      manager,
    });
  } catch (err) {
    console.error("❌ rejectCompanyManager ERROR:", err);
    res.status(500).json({ error: "Server error rejecting manager" });
  }
};

/* ==========================================================
   🔐 CREATE MANAGER LOGIN (AFTER VERIFIED)
   POST /api/company/managers/:managerId/create-account
========================================================== */
export const createCompanyManagerAccount = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { managerId } = req.params;
    const { email, password } = req.body;

    const manager = await ensureManagerInCompany({ companyId, managerId });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    if (manager.managerVerificationStatus !== "verified") {
      return res.status(400).json({
        error: "Manager must be verified before creating account.",
      });
    }

    if (!sanitize(email) || !sanitize(password)) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = sanitize(email).toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });

    if (exists && String(exists._id) !== String(manager._id)) {
      return res.status(400).json({ error: "Email already in use." });
    }

    manager.email = normalizedEmail;
    manager.passwordHash = await bcrypt.hash(password, 10);
    manager.managerOnboardingStage = "account_created";

    await manager.save();

    res.json({
      ok: true,
      message: "Manager account created successfully.",
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        shopId: manager.shopId,
        managerOnboardingStage: manager.managerOnboardingStage,
      },
    });
  } catch (err) {
    console.error("❌ createCompanyManagerAccount ERROR:", err);
    res.status(500).json({ error: "Server error creating manager account" });
  }
};

/* ==========================================================
   🔁 TOGGLE MANAGER ACTIVE / INACTIVE
========================================================== */
export const toggleCompanyManagerStatus = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { managerId } = req.params;

    const manager = await ensureManagerInCompany({ companyId, managerId });
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    manager.isActive = !manager.isActive;
    await manager.save();

    res.json({
      ok: true,
      message: `Manager is now ${manager.isActive ? "active" : "inactive"}`,
      manager,
    });
  } catch (err) {
    console.error("❌ toggleCompanyManagerStatus ERROR:", err);
    res.status(500).json({ error: "Server error updating manager status" });
  }
};
/* ==========================================================
   💬 LIST MANAGERS FOR COMPANY CHAT
   GET /api/company/manager/list
========================================================== */
export const listManagersForCompanyChat = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    const managers = await User.find({
      role: "manager",
      companyId,
      isActive: true,
      managerVerificationStatus: "verified",
      managerOnboardingStage: "account_created",
    })
      .select("name phone shopId profileImage")
      .populate("shopId", "name")
      .sort({ name: 1 });

    res.json({
      ok: true,
      data: managers.map((m) => ({
        _id: m._id,
        fullName: m.name,
        phone: m.phone || "",
        branchName: m.shopId?.name || null,
        profileImage: m.profileImage || null,
      })),
    });
  } catch (err) {
    console.error("❌ listManagersForCompanyChat ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Server error loading managers for chat",
    });
  }
};
