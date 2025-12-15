import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import GlobalSettings from "../models/GlobalSettings.js";
import ShopProduct from "../models/ShopProduct.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import { resolveCompanyId } from "../utils/resolveCompanyId.js";

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

/* Small constant for low-stock threshold */
const LOW_STOCK_THRESHOLD = 3;

/* ==========================================================
   Helper: resolve company + shop
========================================================== */
const resolveCompanyAndShop = async (req) => {
  const companyId = resolveCompanyId(req.user);
  if (!companyId) return { error: "Unable to resolve companyId" };

  if (req.user.role === "manager") {
    if (!req.user.shopId) {
      return { error: "Manager does not have a shop assigned yet" };
    }
    return { companyId, shopId: req.user.shopId };
  }

  return { companyId, shopId: null };
};

/* ==========================================================
   1) GET SHOP PRODUCTS (Manager / Company)
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) return res.status(400).json({ ok: false, error });

      const filter = { companyId };

      if (req.user.role === "manager") {
        filter.shopId = shopId;
      }

      if (req.user.role === "company" && req.query.shopId) {
        filter.shopId = req.query.shopId;
      }

      const shopProducts = await ShopProduct.find(filter)
        .populate("productId")
        .populate("shopId", "name city");

      const items = shopProducts.map((sp) => ({
        id: sp._id,
        shop: sp.shopId
          ? {
              id: sp.shopId._id,
              name: sp.shopId.name,
              city: sp.shopId.city,
            }
          : null,
        product: sp.productId
          ? {
              id: sp.productId._id,
              name: sp.productId.name,
              image: sp.productId.image || null,
              category: sp.productId.category || null,
              basePrice: sp.productId.price || 0,
            }
          : null,
        price: sp.price,
        stock: sp.stock,
        isActive: sp.isActive,
        discount: sp.discount || 0,
        createdAt: sp.createdAt,
        updatedAt: sp.updatedAt,
      }));

      res.json({
        ok: true,
        count: items.length,
        items,
      });
    } catch (err) {
      console.error("❌ managerShopProducts GET error:", err);
      res.status(500).json({
        ok: false,
        error: "Server error loading shop products",
      });
    }
  }
);

/* ==========================================================
   2) GET COMPANY CATALOG (DOES NOT HIDE ADDED PRODUCTS)
========================================================== */
router.get(
  "/available",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, error } = await resolveCompanyAndShop(req);
      if (error) return res.status(400).json({ ok: false, error });

      // company must validate shopId (logic only)
      if (req.user.role === "company") {
        const shopId = req.query.shopId;
        if (!shopId) {
          return res.status(400).json({
            ok: false,
            error: "shopId is required for company",
          });
        }

        const shop = await Shop.findOne({ _id: shopId, companyId });
        if (!shop) {
          return res.status(404).json({
            ok: false,
            error: "Shop not found for this company",
          });
        }
      }

      // ✅ IMPORTANT: return ALL company products
      const products = await Product.find({ companyId })
        .sort({ createdAt: -1 })
        .select("name image price category isActive");

      res.json({
        ok: true,
        count: products.length,
        products: products.map((p) => ({
          id: p._id,
          name: p.name,
          image: p.image || null,
          category: p.category || null,
          basePrice: p.price || 0,
          isActive: p.isActive !== false,
        })),
      });
    } catch (err) {
      console.error("❌ managerShopProducts /available error:", err);
      res.status(500).json({
        ok: false,
        error: "Server error loading available products",
      });
    }
  }
);

/* ==========================================================
   3) ADD PRODUCT TO SHOP
========================================================== */
router.post(
  "/add",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) return res.status(400).json({ ok: false, error });

      const { productId, price, stock = 0, shopId: bodyShopId } = req.body;
      if (!productId || price == null) {
        return res.status(400).json({
          ok: false,
          error: "productId and price are required",
        });
      }

      let targetShopId = shopId;

      if (req.user.role === "company") {
        if (!bodyShopId) {
          return res.status(400).json({
            ok: false,
            error: "shopId is required",
          });
        }

        const shop = await Shop.findOne({ _id: bodyShopId, companyId });
        if (!shop) {
          return res.status(404).json({
            ok: false,
            error: "Shop not found for this company",
          });
        }

        targetShopId = shop._id;
      }

      const product = await Product.findOne({ _id: productId, companyId });
      if (!product) {
        return res.status(404).json({
          ok: false,
          error: "Product not found for this company",
        });
      }

      const exists = await ShopProduct.findOne({
        companyId,
        shopId: targetShopId,
        productId,
      });

      if (exists) {
        return res.status(400).json({
          ok: false,
          error: "This product is already added to this shop",
        });
      }

      const item = await ShopProduct.create({
        companyId,
        shopId: targetShopId,
        productId,
        price: Number(price),
        stock: Number(stock) || 0,
        isActive: true,
      });

      res.status(201).json({
        ok: true,
        message: "Product added to shop successfully",
        item,
      });
    } catch (err) {
      console.error("❌ managerShopProducts /add error:", err);
      res.status(500).json({
        ok: false,
        error: "Server error adding product to shop",
      });
    }
  }
);

/* ==========================================================
   4) UPDATE STOCK
========================================================== */
router.put(
  "/:id/stock",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) return res.status(400).json({ ok: false, error });

      const { stock } = req.body;
      if (stock == null) {
        return res.status(400).json({ ok: false, error: "stock is required" });
      }

      const filter = { _id: req.params.id, companyId };
      if (req.user.role === "manager") filter.shopId = shopId;

      const sp = await ShopProduct.findOne(filter);
      if (!sp) {
        return res.status(404).json({ ok: false, error: "Shop product not found" });
      }

      sp.stock = Number(stock);
      if (sp.stock > LOW_STOCK_THRESHOLD) sp.lowStockAlertSent = false;

      await sp.save();

      res.json({ ok: true, message: "Stock updated", item: sp });
    } catch (err) {
      console.error("❌ stock update error:", err);
      res.status(500).json({ ok: false, error: "Server error updating stock" });
    }
  }
);

/* ==========================================================
   5) UPDATE PRICE / DISCOUNT
========================================================== */
router.put(
  "/:id/price",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) return res.status(400).json({ ok: false, error });

      const { price, discount } = req.body;
      if (price == null) {
        return res.status(400).json({ ok: false, error: "price is required" });
      }

      const filter = { _id: req.params.id, companyId };
      if (req.user.role === "manager") filter.shopId = shopId;

      const sp = await ShopProduct.findOne(filter);
      if (!sp) {
        return res.status(404).json({ ok: false, error: "Shop product not found" });
      }

      sp.price = Number(price);
      if (discount != null) sp.discount = Number(discount);

      await sp.save();

      res.json({ ok: true, message: "Price updated", item: sp });
    } catch (err) {
      console.error("❌ price update error:", err);
      res.status(500).json({ ok: false, error: "Server error updating price" });
    }
  }
);

/* ==========================================================
   6) TOGGLE ACTIVE / INACTIVE
========================================================== */
router.put(
  "/:id/toggle",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) return res.status(400).json({ ok: false, error });

      const filter = { _id: req.params.id, companyId };
      if (req.user.role === "manager") filter.shopId = shopId;

      const sp = await ShopProduct.findOne(filter);
      if (!sp) {
        return res.status(404).json({ ok: false, error: "Shop product not found" });
      }

      sp.isActive = !sp.isActive;
      await sp.save();

      res.json({
        ok: true,
        message: `Product is now ${sp.isActive ? "active" : "inactive"}`,
        item: sp,
      });
    } catch (err) {
      console.error("❌ toggle error:", err);
      res.status(500).json({ ok: false, error: "Server error toggling product" });
    }
  }
);

export default router;
