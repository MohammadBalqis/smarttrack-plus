import Shop from "../models/Shop.js";

export const createCompanyShop = async (req, res) => {
  try {
    const companyId = req.user._id; // logged-in company

    const shop = await Shop.create({
      companyId,
      name: req.body.name,
      city: req.body.city,
      address: req.body.address,
      phone: req.body.phone,
      location: {
        lat: req.body.location?.lat,
        lng: req.body.location?.lng,
      },
    });

    res.json({
      ok: true,
      message: "Shop created successfully",
      shop,
    });
  } catch (err) {
    console.error("Create shop error:", err);
    res.status(500).json({ ok: false, error: "Failed to create shop" });
  }
};
