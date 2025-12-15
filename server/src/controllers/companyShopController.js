import Shop from "../models/Shop.js";
import User from "../models/User.js";

/* ==========================================================
   🏪 CREATE SHOP / BRANCH
   Role: company
   POST /api/company/shops
========================================================== */
export const createCompanyShop = async (req, res) => {
  try {
    const companyId = req.user._id;

    const {
      name,
      city,
      address,
      phone,
      lat,
      lng,
      workingHours,
      deliveryFeeOverride,
      maxDeliveryDistanceKm,
    } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({
        ok: false,
        error: "Name, city, and address are required.",
      });
    }

    const shop = await Shop.create({
      companyId,
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      phone: phone || null,

      location: {
        lat: lat ?? null,
        lng: lng ?? null,
      },

      workingHours: {
        open: workingHours?.open || "08:00",
        close: workingHours?.close || "22:00",
        timezone: workingHours?.timezone || "Asia/Beirut",
      },

      deliveryFeeOverride:
        deliveryFeeOverride === undefined ? null : Number(deliveryFeeOverride),

      maxDeliveryDistanceKm:
        maxDeliveryDistanceKm === undefined
          ? null
          : Number(maxDeliveryDistanceKm),

      managerId: null,
      driversCount: 0,
      isActive: true,
    });

    return res.status(201).json({
      ok: true,
      message: "Shop created successfully.",
      shop,
    });
  } catch (err) {
    console.error("❌ createCompanyShop ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to create shop.",
    });
  }
};

/* ==========================================================
   🏪 GET ALL SHOPS (COMPANY)
========================================================== */
export const getCompanyShops = async (req, res) => {
  try {
    const companyId = req.user._id;

    const shops = await Shop.find({ companyId })
      .populate("managerId", "name phone email managerVerificationStatus")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      count: shops.length,
      shops,
    });
  } catch (err) {
    console.error("❌ getCompanyShops ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to load shops.",
    });
  }
};

/* ==========================================================
   🏪 UPDATE SHOP INFO (NO MANAGER)
========================================================== */
export const updateCompanyShop = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { shopId } = req.params;

    const shop = await Shop.findOne({ _id: shopId, companyId });
    if (!shop) {
      return res.status(404).json({ ok: false, error: "Shop not found." });
    }

    const {
      name,
      city,
      address,
      phone,
      lat,
      lng,
      workingHours,
      deliveryFeeOverride,
      maxDeliveryDistanceKm,
    } = req.body;

    if (name !== undefined) shop.name = name.trim();
    if (city !== undefined) shop.city = city.trim();
    if (address !== undefined) shop.address = address.trim();
    if (phone !== undefined) shop.phone = phone || null;

    if (lat !== undefined || lng !== undefined) {
      shop.location = {
        lat: lat ?? shop.location.lat,
        lng: lng ?? shop.location.lng,
      };
    }

    if (workingHours) {
      shop.workingHours = {
        open: workingHours.open || shop.workingHours.open,
        close: workingHours.close || shop.workingHours.close,
        timezone: workingHours.timezone || shop.workingHours.timezone,
      };
    }

    if (deliveryFeeOverride !== undefined) {
      shop.deliveryFeeOverride =
        deliveryFeeOverride === null
          ? null
          : Number(deliveryFeeOverride);
    }

    if (maxDeliveryDistanceKm !== undefined) {
      shop.maxDeliveryDistanceKm =
        maxDeliveryDistanceKm === null
          ? null
          : Number(maxDeliveryDistanceKm);
    }

    await shop.save();

    res.json({
      ok: true,
      message: "Shop updated successfully.",
      shop,
    });
  } catch (err) {
    console.error("❌ updateCompanyShop ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to update shop.",
    });
  }
};

/* ==========================================================
   👤 ASSIGN / REPLACE MANAGER
   - Detaches old manager
   - Attaches new one
========================================================== */
export const assignShopManager = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { shopId } = req.params;
    const { managerId } = req.body;

    const shop = await Shop.findOne({ _id: shopId, companyId });
    if (!shop) {
      return res.status(404).json({ ok: false, error: "Shop not found." });
    }

    const manager = await User.findOne({
      _id: managerId,
      role: "manager",
      companyId,
    });

    if (!manager) {
      return res.status(404).json({
        ok: false,
        error: "Manager not found or not part of this company.",
      });
    }

    // ❌ must be verified before assignment
    if (manager.managerVerificationStatus !== "verified") {
      return res.status(400).json({
        ok: false,
        error: "Manager must be verified before assignment.",
      });
    }

    // 🔄 Detach old manager if exists
    if (shop.managerId) {
      await User.updateOne(
        { _id: shop.managerId },
        { $set: { shopId: null } }
      );
    }

    // ✅ Assign new manager
    shop.managerId = manager._id;
    await shop.save();

    manager.shopId = shop._id;
    await manager.save();

    res.json({
      ok: true,
      message: "Manager assigned to shop successfully.",
      shop,
      manager: {
        _id: manager._id,
        name: manager.name,
        phone: manager.phone,
        email: manager.email,
      },
    });
  } catch (err) {
    console.error("❌ assignShopManager ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to assign manager.",
    });
  }
};

/* ==========================================================
   🚫 REMOVE MANAGER FROM SHOP
========================================================== */
export const removeShopManager = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { shopId } = req.params;

    const shop = await Shop.findOne({ _id: shopId, companyId });
    if (!shop) {
      return res.status(404).json({ ok: false, error: "Shop not found." });
    }

    if (!shop.managerId) {
      return res.status(400).json({
        ok: false,
        error: "This shop has no assigned manager.",
      });
    }

    await User.updateOne(
      { _id: shop.managerId },
      { $set: { shopId: null } }
    );

    shop.managerId = null;
    await shop.save();

    res.json({
      ok: true,
      message: "Manager removed from shop.",
      shop,
    });
  } catch (err) {
    console.error("❌ removeShopManager ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to remove manager.",
    });
  }
};

/* ==========================================================
   🏪 DEACTIVATE SHOP
========================================================== */
export const deactivateCompanyShop = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { shopId } = req.params;

    const shop = await Shop.findOne({ _id: shopId, companyId });
    if (!shop) {
      return res.status(404).json({ ok: false, error: "Shop not found." });
    }

    shop.isActive = false;
    await shop.save();

    res.json({
      ok: true,
      message: "Shop deactivated successfully.",
      shop,
    });
  } catch (err) {
    console.error("❌ deactivateCompanyShop ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to deactivate shop.",
    });
  }
};
