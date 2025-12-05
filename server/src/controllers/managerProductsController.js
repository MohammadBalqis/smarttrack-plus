import Product from "../models/Product.js";
import { resolveCompanyId } from "../utils/resolveCompanyId.js";

/* ==========================================================
   1) LIST PRODUCTS IN MANAGER'S SHOP
========================================================== */
export const getManagerProducts = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const shopId = req.user.shopId;

    if (!companyId || !shopId) {
      return res.status(400).json({ ok: false, error: "Manager has no shop." });
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

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const filter = { companyId, shopId };

    if (category) filter.category = category;
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    if (search) filter.name = new RegExp(search, "i");

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      products,
    });
  } catch (err) {
    console.error("getManagerProducts error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};

/* ==========================================================
   2) GET SINGLE PRODUCT
========================================================== */
export const getManagerProduct = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const shopId = req.user.shopId;
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      companyId,
      shopId,
    });

    if (!product) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    res.json({ ok: true, product });
  } catch (err) {
    console.error("getManagerProduct error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};

/* ==========================================================
   3) UPDATE PRODUCT (manager)
========================================================== */
export const updateManagerProduct = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { productId } = req.params;
    const { price, stock, isActive, notes } = req.body;

    const product = await Product.findOne({
      _id: productId,
      shopId,
    });

    if (!product)
      return res.status(404).json({ ok: false, error: "Product not found" });

    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (isActive !== undefined) product.isActive = isActive;
    if (notes !== undefined) product.notes = notes;

    await product.save();

    res.json({ ok: true, message: "Updated", product });
  } catch (err) {
    console.error("updateManagerProduct error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};
