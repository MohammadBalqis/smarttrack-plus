// server/src/routes/globalSettingsRoutes.js

import { Router } from "express";
import GlobalSettings from "../models/GlobalSettings.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

// SETTINGS CACHE HELPERS
import {
  loadGlobalSettings,
  refreshGlobalSettings,
} from "../middleware/globalSettingsMiddleware.js";

const router = Router();
const superAdminOnly = [protect, authorizeRoles("superadmin")];

/* ==========================================================
   1️⃣ GET ALL GLOBAL SETTINGS
   GET /api/settings
========================================================== */
router.get("/", superAdminOnly, async (req, res) => {
  try {
    const settings = await loadGlobalSettings(); // load cached version

    res.json({
      ok: true,
      settings,
    });
  } catch (err) {
    console.error("❌ Global settings fetch error:", err.message);
    res.status(500).json({ error: "Failed to load global settings" });
  }
});

/* ==========================================================
   2️⃣ UPDATE GLOBAL SETTINGS
   PATCH /api/settings
========================================================== */
router.patch("/", superAdminOnly, async (req, res) => {
  try {
    const updates = req.body;

    const settings = await GlobalSettings.findOneAndUpdate({}, updates, {
      new: true,
      upsert: true,
    });

    // IMPORTANT — refresh cache
    await refreshGlobalSettings();

    res.json({
      ok: true,
      message: "Global settings updated successfully",
      settings,
    });
  } catch (err) {
    console.error("❌ Global settings update error:", err.message);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

/* ==========================================================
   3️⃣ TOGGLE MAINTENANCE MODE
   PATCH /api/settings/maintenance/toggle
========================================================== */
router.patch("/maintenance/toggle", superAdminOnly, async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne();

    if (!settings) {
      settings = await GlobalSettings.create({});
    }

    settings.maintenanceMode = !settings.maintenanceMode;
    await settings.save();

    // REFRESH cache after toggle
    await refreshGlobalSettings();

    res.json({
      ok: true,
      maintenanceMode: settings.maintenanceMode,
      message: `System is now ${
        settings.maintenanceMode ? "in maintenance mode" : "active"
      }`,
    });
  } catch (err) {
    console.error("❌ Maintenance toggle error:", err.message);
    res.status(500).json({ error: "Failed to toggle maintenance mode" });
  }
});

export default router;
