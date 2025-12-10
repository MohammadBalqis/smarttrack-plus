// server/src/controllers/systemOwner/systemOwnerSettingsController.js
import GlobalSettings from "../../models/GlobalSettings.js";

/* ==========================================================
   Helper: ensure we always have ONE settings document
========================================================== */
const ensureSettings = async () => {
  let settings = await GlobalSettings.findOne();
  if (!settings) {
    settings = await GlobalSettings.create({});
  }
  return settings;
};

/* ==========================================================
   SO.7 — GET OWNER SETTINGS
   GET /api/owner/settings
========================================================== */
export const getOwnerSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    return res.json({ ok: true, settings });
  } catch (err) {
    console.error("getOwnerSettings error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error loading settings." });
  }
};

/* ==========================================================
   SO.7 — UPDATE OWNER SETTINGS
   PUT /api/owner/settings
   Body can include partial fields, e.g:
   {
     platformName,
     platformCurrency,
     supportEmail,
     maintenanceMode,
     maintenanceMessage,
     billingGraceDays,
     invoiceFooterNote,
     subscriptionTiers: [...]
   }
========================================================== */
export const updateOwnerSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();

    const {
      platformName,
      platformCurrency,
      supportEmail,
      maintenanceMode,
      maintenanceMessage,
      billingGraceDays,
      invoiceFooterNote,
      subscriptionTiers,
    } = req.body;

    if (platformName !== undefined) settings.platformName = platformName;
    if (platformCurrency !== undefined)
      settings.platformCurrency = platformCurrency;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (maintenanceMode !== undefined)
      settings.maintenanceMode = !!maintenanceMode;
    if (maintenanceMessage !== undefined)
      settings.maintenanceMessage = maintenanceMessage;
    if (billingGraceDays !== undefined)
      settings.billingGraceDays = Number(billingGraceDays) || 0;
    if (invoiceFooterNote !== undefined)
      settings.invoiceFooterNote = invoiceFooterNote;

    // Optional: full replace of subscription tiers
    if (Array.isArray(subscriptionTiers)) {
      settings.subscriptionTiers = subscriptionTiers.map((t) => ({
        key: t.key,
        label: t.label,
        minDrivers: t.minDrivers,
        maxDrivers: t.maxDrivers ?? null,
        priceUsd: t.priceUsd,
        isActive: t.isActive !== undefined ? !!t.isActive : true,
      }));
    }

    await settings.save();

    return res.json({
      ok: true,
      message: "Settings updated successfully.",
      settings,
    });
  } catch (err) {
    console.error("updateOwnerSettings error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Server error updating settings." });
  }
};
