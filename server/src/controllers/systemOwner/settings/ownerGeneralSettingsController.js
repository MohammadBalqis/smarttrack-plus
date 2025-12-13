import SystemOwnerSettings from "../../../models/SystemOwnerSettings.js";

export const getGeneralSettings = async (req, res) => {
  try {
    let settings = await SystemOwnerSettings.findOne({
      ownerId: req.user._id,
    });

    if (!settings) {
      settings = await SystemOwnerSettings.create({
        ownerId: req.user._id,
      });
    }

    return res.json({
      ok: true,
      general: {
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
      },
    });
  } catch (err) {
    console.error("getGeneralSettings error:", err);
    res.status(500).json({ ok: false, error: "Failed to load general settings." });
  }
};

export const updateGeneralSettings = async (req, res) => {
  try {
    const { platformName, supportEmail, supportPhone } = req.body;

    const settings = await SystemOwnerSettings.findOneAndUpdate(
      { ownerId: req.user._id },
      { platformName, supportEmail, supportPhone },
      { new: true, upsert: true }
    );

    return res.json({
      ok: true,
      message: "General settings updated.",
      general: settings,
    });
  } catch (err) {
    console.error("updateGeneralSettings error:", err);
    res.status(500).json({ ok: false, error: "Failed to update settings." });
  }
};
