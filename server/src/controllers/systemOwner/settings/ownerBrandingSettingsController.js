import SystemOwnerSettings from "../../../models/SystemOwnerSettings.js";

/* ==========================================================
   GET BRANDING SETTINGS
========================================================== */
export const getBrandingSettings = async (req, res) => {
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
      branding: {
        platformName: settings.platformName,
        platformLogo: settings.platformLogo,
      },
    });
  } catch (err) {
    console.error("getBrandingSettings error:", err);
    res.status(500).json({ ok: false, error: "Failed to load branding settings." });
  }
};

/* ==========================================================
   UPDATE BRANDING SETTINGS
========================================================== */
export const updateBrandingSettings = async (req, res) => {
  try {
    const { platformName, platformLogo } = req.body;

    const settings = await SystemOwnerSettings.findOneAndUpdate(
      { ownerId: req.user._id },
      { platformName, platformLogo },
      { new: true, upsert: true }
    );

    return res.json({
      ok: true,
      message: "Branding updated.",
      branding: settings,
    });
  } catch (err) {
    console.error("updateBrandingSettings error:", err);
    res.status(500).json({ ok: false, error: "Failed to update branding." });
  }
};
