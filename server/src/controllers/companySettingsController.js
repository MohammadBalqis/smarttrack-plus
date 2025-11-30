// server/src/controllers/companySettingsController.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";

/**
 * GET /api/company/settings/profile
 * Return basic company profile + preferences
 */
export const getCompanyProfile = async (req, res) => {
  try {
    const userId = req.user._id; // company owner
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "Company not found." });
    }

    const profile = {
      companyName: user.companyName || user.name || "",
      companyDisplayName: user.companyDisplayName || "",
      legalName: user.legalName || "",
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      website: user.website || "",
      country: user.country || "",
      city: user.city || "",
      addressLine: user.addressLine || "",
      registrationNumber: user.registrationNumber || "",
      taxNumber: user.taxNumber || "",
      contactPersonName: user.contactPersonName || "",
      contactPersonPhone: user.contactPersonPhone || "",
      industry: user.industry || "",
    };

    const preferences = {
      notificationsEmail: user.notificationsEmail ?? true,
      notificationsSms: user.notificationsSms ?? false,
      notificationsPush: user.notificationsPush ?? true,
      dailySummaryEmail: user.dailySummaryEmail ?? false,
      language: user.language || "en",
      timezone: user.timezone || "Asia/Beirut",
    };

    res.json({ ok: true, profile, preferences });
  } catch (err) {
    console.error("getCompanyProfile error:", err);
    res.status(500).json({ error: "Failed to load company profile." });
  }
};

/**
 * PUT /api/company/settings/profile
 * Update basic company information
 */
export const updateCompanyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const allowedFields = [
      "companyName",
      "companyDisplayName",
      "legalName",
      "email",
      "phoneNumber",
      "website",
      "country",
      "city",
      "addressLine",
      "registrationNumber",
      "taxNumber",
      "contactPersonName",
      "contactPersonPhone",
      "industry",
    ];

    const update = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "Company not found." });
    }

    const profile = {
      companyName: user.companyName || user.name || "",
      companyDisplayName: user.companyDisplayName || "",
      legalName: user.legalName || "",
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      website: user.website || "",
      country: user.country || "",
      city: user.city || "",
      addressLine: user.addressLine || "",
      registrationNumber: user.registrationNumber || "",
      taxNumber: user.taxNumber || "",
      contactPersonName: user.contactPersonName || "",
      contactPersonPhone: user.contactPersonPhone || "",
      industry: user.industry || "",
    };

    res.json({ ok: true, profile });
  } catch (err) {
    console.error("updateCompanyProfile error:", err);
    res.status(500).json({ error: "Failed to update company profile." });
  }
};

/**
 * PUT /api/company/settings/password
 * Change company owner password
 */
export const updateCompanyPassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Old password and new password are required." });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ ok: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("updateCompanyPassword error:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
};

/**
 * PUT /api/company/settings/preferences
 * Update notification + localization preferences
 */
export const updateCompanyPreferences = async (req, res) => {
  try {
    const userId = req.user._id;

    const allowed = [
      "notificationsEmail",
      "notificationsSms",
      "notificationsPush",
      "dailySummaryEmail",
      "language",
      "timezone",
    ];

    const update = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const preferences = {
      notificationsEmail: user.notificationsEmail ?? true,
      notificationsSms: user.notificationsSms ?? false,
      notificationsPush: user.notificationsPush ?? true,
      dailySummaryEmail: user.dailySummaryEmail ?? false,
      language: user.language || "en",
      timezone: user.timezone || "Asia/Beirut",
    };

    res.json({ ok: true, preferences });
  } catch (err) {
    console.error("updateCompanyPreferences error:", err);
    res.status(500).json({ error: "Failed to update preferences." });
  }
};
