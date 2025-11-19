// server/src/routes/globalSettingsRoutes.js
import { Router } from "express";
import GlobalSettings from "../models/GlobalSettings.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  loadGlobalSettings,
  refreshGlobalSettings,
} from "../middleware/globalSettingsMiddleware.js";

const router = Router();
const superOnly = [protect, authorizeRoles("superadmin")];

/* ==========================================================
   1. Get (cached) Global Settings
========================================================== */
router.get("/", superOnly, async (req, res) => {
  try {
    const settings = await loadGlobalSettings();
    res.json({ ok: true, settings });
  } catch (err) {
    console.error("❌ Error loading global settings:", err);
    res.status(500).json({ error: "Cannot load global settings" });
  }
});

/* ==========================================================
   2. Update Settings
========================================================== */
router.patch("/", superOnly, async (req, res) => {
  try {
    const updates = req.body;

    const updated = await GlobalSettings.findOneAndUpdate({}, updates, {
      new: true,
      upsert: true,
    });

    await refreshGlobalSettings();

    res.json({
      ok: true,
      message: "Settings updated",
      settings: updated,
    });
  } catch (err) {
    console.error("❌ Global settings update error:", err);
    res.status(500).json({ error: "Cannot update settings" });
  }
});

/* ==========================================================
   3. Toggle Maintenance Mode
========================================================== */
router.patch("/maintenance/toggle", superOnly, async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne();

    if (!settings) settings = await GlobalSettings.create({});

    settings.maintenanceMode = !settings.maintenanceMode;
    await settings.save();

    await refreshGlobalSettings();

    res.json({
      ok: true,
      maintenanceMode: settings.maintenanceMode,
      message: `System now ${settings.maintenanceMode ? "in maintenance" : "active"}`,
    });
  } catch (err) {
    console.error("❌ Maintenance toggle error:", err);
    res.status(500).json({ error: "Toggle failed" });
  }
});

export default router;
