import SystemConfig from "../../../models/SystemConfig.js";


export const getBillingSettings = async (req, res) => {
  try {
    const config = await SystemConfig.findOne();

    return res.json({
      ok: true,
      billing: config.billingRules,
    });
  } catch (err) {
    console.error("Billing settings load error:", err);
    res.status(500).json({ ok: false, error: "Failed to load billing rules." });
  }
};

export const updateBillingSettings = async (req, res) => {
  try {
    const billingRules = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      {},
      { billingRules },
      { new: true }
    );

    return res.json({
      ok: true,
      message: "Billing rules updated.",
      billing: config.billingRules,
    });
  } catch (err) {
    console.error("Billing settings update error:", err);
    res.status(500).json({ ok: false, error: "Failed to update billing rules." });
  }
};
