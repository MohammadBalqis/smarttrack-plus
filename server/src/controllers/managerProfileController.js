// server/src/controllers/manager/managerProfileController.js

import User from "../models/User.js";

export const getManagerProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    const user = await User.findById(userId)
      .populate("companyId", "name logoUrl")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "Manager not found." });
    }

    // unified response structure (safe for missing fields)
    const profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber || null,
      profileImage: user.profileImage || null,

      company: user.companyId
        ? {
            name: user.companyId.name,
            logoUrl: user.companyId.logoUrl || null,
          }
        : null,

      isEmailVerified: user.isEmailVerified || false,
      isSuspended: user.isSuspended || false,
      isActive: user.isActive !== false,

      timezone: user.timezone || null,
      language: user.language || "English",

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt || null,
    };

    res.json({ ok: true, user: profile });
  } catch (err) {
    console.error("Manager Profile Error:", err);
    res.status(500).json({ error: "Failed to load profile." });
  }
};
