import GlobalSettings from "../../../models/GlobalSettings.js";

export const getSecuritySettings = async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne();
    if (!settings) settings = await GlobalSettings.create({});

    return res.json({
      ok: true,
      security: {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
      },
    });
  } catch (err) {
    console.error("getSecuritySettings error:", err);
    res.status(500).json({ ok: false, error: "Failed to load security settings." });
  }
};

export const updateSecuritySettings = async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;

    let settings = await GlobalSettings.findOne();
    if (!settings) settings = await GlobalSettings.create({});

    if (maintenanceMode !== undefined)
      settings.maintenanceMode = !!maintenanceMode;

    if (maintenanceMessage !== undefined)
      settings.maintenanceMessage = maintenanceMessage;

    await settings.save();

    return res.json({
      ok: true,
      message: "Security settings updated.",
      security: settings,
    });
  } catch (err) {
    console.error("updateSecuritySettings error:", err);
    res.status(500).json({ ok: false, error: "Failed to update security settings." });
  }
};
