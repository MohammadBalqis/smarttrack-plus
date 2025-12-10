import SystemConfig from "../../../models/SystemConfig.js";


export const getBrandingSettings = async (req, res) => {
  try {
    const config = await SystemConfig.findOne();

    return res.json({
      ok: true,
      branding: config.branding,
    });
  } catch (err) {
    console.error("Branding settings load error:", err);
    res.status(500).json({ ok: false, error: "Failed to load branding settings." });
  }
};

export const updateBrandingSettings = async (req, res) => {
  try {
    const branding = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      {},
      { branding },
      { new: true }
    );

    return res.json({
      ok: true,
      message: "Branding settings updated.",
      branding: config.branding,
    });
  } catch (err) {
    console.error("Branding settings update error:", err);
    res.status(500).json({ ok: false, error: "Failed to update branding settings." });
  }
};
