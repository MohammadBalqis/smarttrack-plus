// server/src/routes/managerShopProductsRoutes.js
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

/* Small constant for low-stock threshold (used later in alerts) */
const LOW_STOCK_THRESHOLD = 3;

/* Helper: get company + shop for this user */
const resolveCompanyAndShop = async (req) => {
  const companyId = resolveCompanyId(req.user);
  if (!companyId) return { error: "Unable to resolve companyId" };

  // Manager: must have shopId
  if (req.user.role === "manager") {
    if (!req.user.shopId) {
      return { error: "Manager does not have a shop assigned yet" };
    }
    return { companyId, shopId: req.user.shopId };
  }

  // Company owner: shopId can come from query/body
  return { companyId, shopId: null };
};

/* ==========================================================
   1) GET SHOP PRODUCTS (Manager / Company)
   - Manager: only his shop
   - Company: all shops, or filter ?shopId=...
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) {
        return res.status(400).json({ ok: false, error });
      }

      const filter = { companyId };

      // manager → always own shop
      if (req.user.role === "manager") {
        filter.shopId = shopId;
      }

      // company → optional ?shopId=...
      if (req.user.role === "company" && req.query.shopId) {
        filter.shopId = req.query.shopId;
      }

      const shopProducts = await ShopProduct.find(filter)
        .populate("productId")
        .populate("shopId", "name city");

      const mapped = shopProducts.map((sp) => ({
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
        count: mapped.length,
        items: mapped,
      });
    } catch (err) {
      console.error("❌ managerShopProducts GET error:", err.message);
      res.status(500).json({ ok: false, error: "Server error loading shop products" });
    }
  }
);

/* ==========================================================
   2) GET AVAILABLE PRODUCTS TO ADD TO THIS SHOP
   - Manager: products of his company not yet added to his shop
   - Company: pass ?shopId=...
========================================================== */
router.get(
  "/available",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) {
        return res.status(400).json({ ok: false, error });
      }

      let targetShopId = shopId;

      if (req.user.role === "company") {
        const qsShopId = req.query.shopId;
        if (!qsShopId) {
          return res.status(400).json({
            ok: false,
            error: "shopId is required for company when listing available products",
          });
        }
        // validate shop belongs to this company
        const shop = await Shop.findOne({ _id: qsShopId, companyId });
        if (!shop) {
          return res
            .status(404)
            .json({ ok: false, error: "Shop not found for this company" });
        }
        targetShopId = shop._id;
      }

      // 1) get products already in this shop
      const shopProducts = await ShopProduct.find({
        companyId,
        shopId: targetShopId,
      }).select("productId");

      const existingIds = shopProducts.map((sp) => sp.productId);

      // 2) list all company products NOT in shopProducts
      const products = await Product.find({
        companyId,
        _id: { $nin: existingIds },
      })
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
      console.error("❌ managerShopProducts /available error:", err.message);
      res.status(500).json({ ok: false, error: "Server error loading available products" });
    }
  }
);

/* ==========================================================
   3) ADD PRODUCT TO SHOP
   - Body: { productId, price, stock }
   - Manager: his shop only
   - Company: must send shopId
========================================================== */
router.post(
  "/add",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) {
        return res.status(400).json({ ok: false, error });
      }

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
            error: "shopId is required in body when company adds product",
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

      // Validate product belongs to this company
      const product = await Product.findOne({
        _id: productId,
        companyId,
      });

      if (!product) {
        return res.status(404).json({
          ok: false,
          error: "Product not found for this company",
        });
      }

      // Check if already exists
      const existing = await ShopProduct.findOne({
        companyId,
        shopId: targetShopId,
        productId: product._id,
      });

      if (existing) {
        return res.status(400).json({
          ok: false,
          error: "This product is already added to this shop",
        });
      }

      const shopProduct = await ShopProduct.create({
        companyId,
        shopId: targetShopId,
        productId: product._id,
        price: Number(price),
        stock: Number(stock) || 0,
        isActive: true,
      });

      res.status(201).json({
        ok: true,
        message: "Product added to shop successfully",
        item: shopProduct,
      });
    } catch (err) {
      console.error("❌ managerShopProducts /add error:", err.message);
      res.status(500).json({ ok: false, error: "Server error adding product to shop" });
    }
  }
);

/* ==========================================================
   4) UPDATE STOCK
   - PUT /:id/stock
   - Body: { stock }
========================================================== */
router.put(
  "/:id/stock",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) {
        return res.status(400).json({ ok: false, error });
      }

      const { stock } = req.body;
      if (stock == null) {
        return res.status(400).json({
          ok: false,
          error: "stock is required",
        });
      }

      const filter = {
        _id: req.params.id,
        companyId,
      };

      if (req.user.role === "manager") {
        filter.shopId = shopId;
      }

      const sp = await ShopProduct.findOne(filter);
      if (!sp) {
        return res.status(404).json({
          ok: false,
          error: "Shop product not found",
        });
      }

      sp.stock = Number(stock);

      // reset lowStockAlertSent if stock is now above threshold
      if (sp.stock > LOW_STOCK_THRESHOLD) {
        sp.lowStockAlertSent = false;
      }

      await sp.save();

      res.json({
        ok: true,
        message: "Stock updated",
        item: sp,
      });
    } catch (err) {
      console.error("❌ managerShopProducts /:id/stock error:", err.message);
      res.status(500).json({ ok: false, error: "Server error updating stock" });
    }
  }
);

/* ==========================================================
   5) UPDATE PRICE / DISCOUNT
   - PUT /:id/price
   - Body: { price, discount? }
========================================================== */
router.put(
  "/:id/price",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) {
        return res.status(400).json({ ok: false, error });
      }

      const { price, discount } = req.body;
      if (price == null) {
        return res.status(400).json({
          ok: false,
          error: "price is required",
        });
      }

      const filter = {
        _id: req.params.id,
        companyId,
      };

      if (req.user.role === "manager") {
        filter.shopId = shopId;
      }

      const sp = await ShopProduct.findOne(filter);
      if (!sp) {
        return res.status(404).json({
          ok: false,
          error: "Shop product not found",
        });
      }

      sp.price = Number(price);
      if (discount != null) {
        sp.discount = Number(discount);
      }

      await sp.save();

      res.json({
        ok: true,
        message: "Price updated",
        item: sp,
      });
    } catch (err) {
      console.error("❌ managerShopProducts /:id/price error:", err.message);
      res.status(500).json({ ok: false, error: "Server error updating price" });
    }
  }
);

/* ==========================================================
   6) TOGGLE ACTIVE / INACTIVE
   - PUT /:id/toggle
========================================================== */
router.put(
  "/:id/toggle",
  protect,
  authorizeRoles("manager", "company"),
  async (req, res) => {
    try {
      if (!(await ensureNotInMaintenance(req, res))) return;

      const { companyId, shopId, error } = await resolveCompanyAndShop(req);
      if (error) {
        return res.status(400).json({ ok: false, error });
      }

      const filter = {
        _id: req.params.id,
        companyId,
      };

      if (req.user.role === "manager") {
        filter.shopId = shopId;
      }

      const sp = await ShopProduct.findOne(filter);
      if (!sp) {
        return res.status(404).json({
          ok: false,
          error: "Shop product not found",
        });
      }

      sp.isActive = !sp.isActive;
      await sp.save();

      res.json({
        ok: true,
        message: `Product is now ${sp.isActive ? "active" : "inactive"} in this shop`,
        item: sp,
      });
    } catch (err) {
      console.error("❌ managerShopProducts /:id/toggle error:", err.message);
      res.status(500).json({ ok: false, error: "Server error toggling product" });
    }
  }
);

export default router;
