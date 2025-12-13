import GlobalSettings from "../../../models/GlobalSettings.js";

/* ==========================================================
   GET BILLING SETTINGS (GLOBAL)
========================================================== */
export const getBillingSettings = async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne();
    if (!settings) settings = await GlobalSettings.create({});

    return res.json({
      ok: true,
      billing: {
        platformCurrency: settings.platformCurrency,
        billingGraceDays: settings.billingGraceDays,
        invoiceFooterNote: settings.invoiceFooterNote,
        subscriptionTiers: settings.subscriptionTiers,
      },
    });
  } catch (err) {
    console.error("getBillingSettings error:", err);
    res.status(500).json({ ok: false, error: "Failed to load billing settings." });
  }
};

/* ==========================================================
   UPDATE BILLING SETTINGS (GLOBAL)
========================================================== */
export const updateBillingSettings = async (req, res) => {
  try {
    const {
      platformCurrency,
      billingGraceDays,
      invoiceFooterNote,
      subscriptionTiers,
    } = req.body;

    let settings = await GlobalSettings.findOne();
    if (!settings) settings = await GlobalSettings.create({});

    if (platformCurrency !== undefined)
      settings.platformCurrency = platformCurrency;

    if (billingGraceDays !== undefined)
      settings.billingGraceDays = Number(billingGraceDays);

    if (invoiceFooterNote !== undefined)
      settings.invoiceFooterNote = invoiceFooterNote;

    if (Array.isArray(subscriptionTiers))
      settings.subscriptionTiers = subscriptionTiers;

    await settings.save();

    return res.json({
      ok: true,
      message: "Billing settings updated.",
      billing: settings,
    });
  } catch (err) {
    console.error("updateBillingSettings error:", err);
    res.status(500).json({ ok: false, error: "Failed to update billing settings." });
  }
};
