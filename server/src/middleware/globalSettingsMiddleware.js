// server/src/middleware/globalSettingsMiddleware.js

import GlobalSettings from "../models/GlobalSettings.js";

/* ==========================================================
   🧠 CACHED SETTINGS
========================================================== */
let cachedSettings = null;

/* ==========================================================
   🔄 LOAD GLOBAL SETTINGS (refresh every time it's called)
========================================================== */
export const loadGlobalSettings = async () => {
  let settings = await GlobalSettings.findOne();
  if (!settings) {
    settings = await GlobalSettings.create({});
  }
  cachedSettings = settings;
  return cachedSettings;
};

/* ==========================================================
   📌 GET SETTING VALUE (used in controllers)
========================================================== */
export const getSettingValue = (key) => {
  if (!cachedSettings) return null;
  return cachedSettings[key];
};

/* ==========================================================
   🚫 BLOCK FEATURE IF DISABLED
   - also blocks system under maintenance (except superadmin)
========================================================== */
export const checkGlobalSetting = (settingName) => {
  return async (req, res, next) => {
    const settings = cachedSettings || (await loadGlobalSettings());

    // 🛑 System Maintenance Mode
    if (settings.maintenanceMode && req.user?.role !== "superadmin") {
      return res.status(503).json({
        ok: false,
        error: "System is currently in maintenance mode.",
      });
    }

    // 🛑 Feature disabled
    if (settings[settingName] === false) {
      return res.status(403).json({
        ok: false,
        error: `Feature disabled by system administrator: ${settingName}`,
      });
    }

    next();
  };
};

/* ==========================================================
   🔁 REFRESH SETTINGS AFTER UPDATE
   - Called from globalSettingsRoutes
========================================================== */
export const refreshGlobalSettings = async () => {
  const settings = await GlobalSettings.findOne();
  cachedSettings = settings;
  console.log("🔄 Global Settings Refreshed");
};
