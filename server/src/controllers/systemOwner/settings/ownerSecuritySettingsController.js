import SystemConfig from "../../../models/SystemConfig.js";


export const getSecuritySettings = async (req, res) => {
  try {
    const config = await SystemConfig.findOne();

    return res.json({
      ok: true,
      security: config.securitySettings,
    });
  } catch (err) {
    console.error("Security settings load error:", err);
    res.status(500).json({ ok: false, error: "Failed to load security settings." });
  }
};

export const updateSecuritySettings = async (req, res) => {
  try {
    const securitySettings = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      {},
      { securitySettings },
      { new: true }
    );

    return res.json({
      ok: true,
      message: "Security settings updated.",
      security: config.securitySettings,
    });
  } catch (err) {
    console.error("Security update error:", err);
    res.status(500).json({ ok: false, error: "Failed to update security settings." });
  }
};
