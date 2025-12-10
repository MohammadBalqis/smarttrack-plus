import SystemConfig from "../../../models/SystemConfig.js";


/* ==========================================================
   GET GENERAL SETTINGS
========================================================== */
export const getGeneralSettings = async (req, res) => {
  try {
    const config = await SystemConfig.findOne();

    return res.json({
      ok: true,
      general: {
        platformName: config.platformName,
        ownerEmail: config.ownerEmail,
        supportEmail: config.supportEmail,
        supportPhone: config.supportPhone,
      },
    });
  } catch (err) {
    console.error("General settings load error:", err);
    res.status(500).json({ ok: false, error: "Failed to load general settings." });
  }
};

/* ==========================================================
   UPDATE GENERAL SETTINGS
========================================================== */
export const updateGeneralSettings = async (req, res) => {
  try {
    const { platformName, ownerEmail, supportEmail, supportPhone } = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      {},
      { platformName, ownerEmail, supportEmail, supportPhone },
      { new: true, upsert: true }
    );

    return res.json({
      ok: true,
      message: "General settings updated successfully.",
      general: config,
    });
  } catch (err) {
    console.error("General settings update error:", err);
    res.status(500).json({ ok: false, error: "Failed to update settings." });
  }
};
