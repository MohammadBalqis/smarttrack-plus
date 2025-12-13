import bcrypt from "bcryptjs";
import User from "../../models/User.js";

const ensureOwnerRole = (req, res) => {
  if (!req.user) {
    res.status(401).json({ ok: false, error: "Not authenticated." });
    return false;
  }

  if (!["owner", "superadmin"].includes(req.user.role)) {
    res.status(403).json({
      ok: false,
      error: "Only system owner / superadmin allowed.",
    });
    return false;
  }
  return true;
};

/* GET PROFILE */
export const getOwnerProfile = async (req, res) => {
  try {
    if (!ensureOwnerRole(req, res)) return;

    const user = await User.findById(req.user._id).select(
      "name email phone avatar role createdAt"
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "Owner profile not found.",
      });
    }

    return res.json({ ok: true, profile: user });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error loading profile." });
  }
};

/* UPDATE PROFILE */
export const updateOwnerProfile = async (req, res) => {
  try {
    if (!ensureOwnerRole(req, res)) return;

    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "Owner profile not found.",
      });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const safeUser = await User.findById(user._id).select(
      "name email phone avatar role createdAt"
    );

    return res.json({
      ok: true,
      message: "Profile updated successfully.",
      profile: safeUser,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error updating profile." });
  }
};

/* UPDATE PASSWORD */
export const updateOwnerPassword = async (req, res) => {
  try {
    if (!ensureOwnerRole(req, res)) return;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        ok: false,
        error: "currentPassword and newPassword are required.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "Owner profile not found.",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(400).json({
        ok: false,
        error: "Current password is incorrect.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error changing password." });
  }
};
