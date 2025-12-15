import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import GlobalSettings from "../models/GlobalSettings.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";

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
   🟢 CREATE SHOP (COMPANY)
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
        return res.status(400).json({
          ok: false,
          error: "name, city and address are required",
        });
      }

      const shop = await Shop.create({
        companyId: req.user._id,
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
      console.error("❌ Create shop error:", err);
      res.status(500).json({ ok: false, error: "Server error creating shop" });
    }
  }
);

/* ==========================================================
   🔵 LIST SHOPS (COMPANY)
   - includes manager info
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
      })
        .populate("managerId", "name phone email isActive")
        .sort({ createdAt: -1 });

      res.json({ ok: true, shops });
    } catch (err) {
      console.error("❌ List shops error:", err);
      res.status(500).json({ ok: false, error: "Server error loading shops" });
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

      const update = {};
      const fields = [
        "name",
        "city",
        "address",
        "phone",
        "deliveryFeeOverride",
        "maxDeliveryDistanceKm",
        "isActive",
      ];

      fields.forEach((f) => {
        if (req.body[f] !== undefined) update[f] = req.body[f];
      });

      if (req.body.lat !== undefined || req.body.lng !== undefined) {
        update.location = {
          lat: req.body.lat ?? null,
          lng: req.body.lng ?? null,
        };
      }

      if (req.body.workingHours) {
        update.workingHours = {
          open: req.body.workingHours.open || "08:00",
          close: req.body.workingHours.close || "22:00",
          timezone:
            req.body.workingHours.timezone || "Asia/Beirut",
        };
      }

      const shop = await Shop.findOneAndUpdate(
        { _id: req.params.id, companyId: req.user._id },
        update,
        { new: true }
      ).populate("managerId", "name phone email");

      if (!shop) {
        return res
          .status(404)
          .json({ ok: false, error: "Shop not found" });
      }

      res.json({ ok: true, shop });
    } catch (err) {
      console.error("❌ Update shop error:", err);
      res.status(500).json({ ok: false, error: "Server error updating shop" });
    }
  }
);

/* ==========================================================
   👤 ASSIGN / CHANGE MANAGER
   PATCH /api/company/shops/:id/assign-manager
========================================================== */
router.patch(
  "/:id/assign-manager",
  protect,
  authorizeRoles("company"),
  async (req, res) => {
    try {
      const { managerId } = req.body;

      const shop = await Shop.findOne({
        _id: req.params.id,
        companyId: req.user._id,
      });

      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      if (managerId) {
        const manager = await User.findOne({
          _id: managerId,
          role: "manager",
          companyId: req.user._id,
        });

        if (!manager) {
          return res.status(400).json({
            error: "Invalid manager",
          });
        }

        shop.managerId = manager._id;
        manager.shopId = shop._id;
        await manager.save();
      } else {
        // remove manager
        shop.managerId = null;
      }

      await shop.save();

      res.json({
        ok: true,
        message: "Manager assignment updated",
        shop,
      });
    } catch (err) {
      console.error("❌ Assign manager error:", err);
      res.status(500).json({ error: "Server error assigning manager" });
    }
  }
);

/* ==========================================================
   🗑 DEACTIVATE SHOP
========================================================== */
router.delete(
  "/:id",
  protect,
  authorizeRoles("company"),
  async (req, res) => {
    try {
      const shop = await Shop.findOneAndUpdate(
        { _id: req.params.id, companyId: req.user._id },
        { isActive: false },
        { new: true }
      );

      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      res.json({
        ok: true,
        message: "Shop deactivated",
        shop,
      });
    } catch (err) {
      console.error("❌ Deactivate shop error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
