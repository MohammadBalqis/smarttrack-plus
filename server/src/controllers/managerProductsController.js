// server/src/controllers/managerProductsController.js
import Product from "../models/Product.js";
import { resolveCompanyId } from "../utils/resolveCompanyId.js";

/* ==========================================================
   1) LIST PRODUCTS FOR MANAGER'S SHOP
========================================================== */
export const getManagerProducts = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const shopId = req.user.shopId || null;

    if (!companyId || !shopId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve company or shop for this manager.",
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      active,
      search,
      minPrice,
      maxPrice,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      companyId,
      shopId, // 🔥 only this shop
    };

    if (category) {
      filter.category = category;
    }

    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i");
      filter.name = regex;
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      products: items,
    });
  } catch (err) {
    console.error("❌ getManagerProducts error:", err.message);
    res.status(500).json({ ok: false, error: "Server error fetching products" });
  }
};

/* ==========================================================
   2) SINGLE PRODUCT DETAILS (MANAGER'S SHOP)
========================================================== */
export const getManagerProduct = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const shopId = req.user.shopId || null;
    const { productId } = req.params;

    if (!companyId || !shopId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve company or shop.",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      companyId,
      shopId,
    });

    if (!product) {
      return res
        .status(404)
        .json({ ok: false, error: "Product not found for this shop" });
    }

    res.json({
      ok: true,
      product,
    });
  } catch (err) {
    console.error("❌ getManagerProduct error:", err.message);
    res.status(500).json({ ok: false, error: "Server error fetching product" });
  }
};

/* ==========================================================
   3) COMPANY CATALOG (GLOBAL PRODUCTS) 
   - Products that belong to company
   - But NOT tied to a specific shop (shopId: null)
========================================================== */
export const getManagerGlobalProducts = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    if (!companyId) {
      return res.status(400).json({
        ok: false,
        error: "Unable to resolve companyId.",
      });
    }

    const { search, category } = req.query;

    const filter = {
      companyId,
      shopId: null, // 🔥 global / master products
    };

    if (category) filter.category = category;

    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i");
      filter.name = regex;
    }

    const products = await Product.find(filter)
      .sort({ name: 1, createdAt: -1 })
      .limit(200); // safe cap

    res.json({
      ok: true,
      total: products.length,
      products,
    });
  } catch (err) {
    console.error("❌ getManagerGlobalProducts error:", err.message);
    res
      .status(500)
      .json({ ok: false, error: "Server error fetching company catalog" });
  }
};

/* ==========================================================
   4) ADD PRODUCT TO MANAGER SHOP FROM COMPANY CATALOG
   - Manager selects baseProduct (company-level)
   - We clone it for this shop with custom price & stock
========================================================== */
export const addManagerProductFromCompany = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const shopId = req.user.shopId || null;
    const { productId } = req.params;
    const { price, stock, isActive = true } = req.body;

    if (!companyId || !shopId) {
      return res.status(400).json({
        ok: false,
        error:
          "Unable to resolve company/shop. Manager must be linked to a shop.",
      });
    }

    // 1) Load base product (company-level)
    const baseProduct = await Product.findOne({
      _id: productId,
      companyId,
      shopId: null,
    });

    if (!baseProduct) {
      return res.status(404).json({
        ok: false,
        error: "Base product not found in company catalog",
      });
    }

    // 2) Optionally: prevent duplicates by same name for same shop
    const existing = await Product.findOne({
      companyId,
      shopId,
      name: baseProduct.name,
    });

    if (existing) {
      return res.status(400).json({
        ok: false,
        error:
          "This product already exists in your shop. You can edit its price & stock.",
      });
    }

    // 3) Clone minimal fields for this shop
    const newProduct = await Product.create({
      companyId,
      shopId,
      // to remember origin, if your schema has it:
      // baseProductId: baseProduct._id,

      name: baseProduct.name,
      description: baseProduct.description,
      category: baseProduct.category,
      images: baseProduct.images,
      sku: baseProduct.sku,
      unit: baseProduct.unit,

      price:
        typeof price === "number"
          ? price
          : typeof baseProduct.price === "number"
          ? baseProduct.price
          : 0,

      stock: typeof stock === "number" ? stock : 0,
      isActive: Boolean(isActive),

      lowStockThreshold: baseProduct.lowStockThreshold || 0,
    });

    res.status(201).json({
      ok: true,
      message: "Product added to your shop successfully",
      product: newProduct,
    });
  } catch (err) {
    console.error("❌ addManagerProductFromCompany error:", err.message);
    res.status(500).json({
      ok: false,
      error: "Server error adding product to shop",
    });
  }
};
// UPDATE Shop Product (manager)
export const updateManagerProduct = async (req, res) => {
  try {
    const manager = req.user;

    if (!manager.shopId) {
      return res.status(400).json({
        ok: false,
        error: "Manager has no assigned shop",
      });
    }

    const { productId } = req.params;
    const { price, stock, isActive, notes } = req.body;

    const shopProduct = await ShopProduct.findOne({
      _id: productId,
      shopId: manager.shopId,
    });

    if (!shopProduct)
      return res.status(404).json({
        ok: false,
        error: "Product not found in your shop",
      });

    // Update fields
    if (price !== undefined) shopProduct.price = Number(price);
    if (stock !== undefined) shopProduct.stock = Number(stock);
    if (isActive !== undefined) shopProduct.isActive = isActive;
    if (notes !== undefined) shopProduct.notes = notes;

    await shopProduct.save();

    res.json({
      ok: true,
      message: "Product updated successfully",
      product: shopProduct,
    });
  } catch (err) {
    console.error("❌ updateManagerProduct error:", err.message);
    res.status(500).json({ ok: false, error: "Server error updating product" });
  }
};
