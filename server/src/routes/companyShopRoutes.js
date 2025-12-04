// server/src/routes/companyShopRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import GlobalSettings from "../models/GlobalSettings.js";
import Shop from "../models/Shop.js";

const router = Router();

/* ==========================================================
   🛡 MAINTENANCE MODE HELPER
========================================================== */
const ensureNotInMaintenance = async (req, res) => {
  const settings = await GlobalSettings.findOne();
  if (settings?.maintenanceMode && req.user.role !== "superadmin") {
    res.status(503).json({
      ok: false,
      error: "System is under maintenance.",
    });
    return false;
  }
  return true;
};

/* ==========================================================
   🟢 CREATE SHOP (COMPANY ONLY)
========================================================== */
router.post(
  "/",
  protect,
  authorizeRoles("company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

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
        return res
          .status(400)
          .json({ ok: false, error: "name, city and address are required" });
      }

      const shop = await Shop.create({
        companyId: req.user._id,
        name,
        city,
        address,
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
          typeof deliveryFeeOverride === "number"
            ? deliveryFeeOverride
            : null,
        maxDeliveryDistanceKm:
          typeof maxDeliveryDistanceKm === "number"
            ? maxDeliveryDistanceKm
            : null,
      });

      res.status(201).json({ ok: true, shop });
    } catch (err) {
      console.error("❌ Create shop error:", err.message);
      res.status(500).json({ ok: false, error: "Server error creating shop" });
    }
  }
);

/* ==========================================================
   🔵 LIST MY SHOPS (COMPANY)
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const shops = await Shop.find({
        companyId: req.user._id,
      }).sort({ createdAt: -1 });

      res.json({ ok: true, shops });
    } catch (err) {
      console.error("❌ List shops error:", err.message);
      res.status(500).json({ ok: false, error: "Server error loading shops" });
    }
  }
);

/* ==========================================================
   🔍 GET SINGLE SHOP (COMPANY)
========================================================== */
router.get(
  "/:id",
  protect,
  authorizeRoles("company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const shop = await Shop.findOne({
        _id: req.params.id,
        companyId: req.user._id,
      });

      if (!shop) {
        return res
          .status(404)
          .json({ ok: false, error: "Shop not found or unauthorized" });
      }

      res.json({ ok: true, shop });
    } catch (err) {
      console.error("❌ Get shop error:", err.message);
      res.status(500).json({ ok: false, error: "Server error loading shop" });
    }
  }
);

/* ==========================================================
   🟡 UPDATE SHOP (COMPANY)
========================================================== */
router.patch(
  "/:id",
  protect,
  authorizeRoles("company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

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
        isActive,
      } = req.body;

      const update = {};

      if (name) update.name = name;
      if (city) update.city = city;
      if (address) update.address = address;
      if (phone !== undefined) update.phone = phone;

      if (lat !== undefined || lng !== undefined) {
        update.location = {};
        if (lat !== undefined) update.location.lat = lat;
        if (lng !== undefined) update.location.lng = lng;
      }

      if (workingHours) {
        update.workingHours = {};
        if (workingHours.open) update.workingHours.open = workingHours.open;
        if (workingHours.close) update.workingHours.close = workingHours.close;
        if (workingHours.timezone)
          update.workingHours.timezone = workingHours.timezone;
      }

      if (deliveryFeeOverride !== undefined)
        update.deliveryFeeOverride =
          deliveryFeeOverride === null
            ? null
            : Number(deliveryFeeOverride);

      if (maxDeliveryDistanceKm !== undefined)
        update.maxDeliveryDistanceKm =
          maxDeliveryDistanceKm === null
            ? null
            : Number(maxDeliveryDistanceKm);

      if (typeof isActive === "boolean") update.isActive = isActive;

      const shop = await Shop.findOneAndUpdate(
        {
          _id: req.params.id,
          companyId: req.user._id,
        },
        update,
        { new: true }
      );

      if (!shop) {
        return res
          .status(404)
          .json({ ok: false, error: "Shop not found or unauthorized" });
      }

      res.json({ ok: true, shop });
    } catch (err) {
      console.error("❌ Update shop error:", err.message);
      res.status(500).json({ ok: false, error: "Server error updating shop" });
    }
  }
);

/* ==========================================================
   🗑 SOFT DELETE / DEACTIVATE SHOP (COMPANY)
========================================================== */
router.delete(
  "/:id",
  protect,
  authorizeRoles("company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const shop = await Shop.findOneAndUpdate(
        { _id: req.params.id, companyId: req.user._id },
        { isActive: false },
        { new: true }
      );

      if (!shop) {
        return res
          .status(404)
          .json({ ok: false, error: "Shop not found or unauthorized" });
      }

      res.json({
        ok: true,
        message: "Shop deactivated successfully",
        shop,
      });
    } catch (err) {
      console.error("❌ Deactivate shop error:", err.message);
      res.status(500).json({ ok: false, error: "Server error deactivating" });
    }
  }
);

export default router;
