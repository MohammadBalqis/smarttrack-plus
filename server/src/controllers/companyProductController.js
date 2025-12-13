import Product from "../models/Product.js";
import BranchStock from "../models/BranchStock.js";
import Shop from "../models/Shop.js";
import { notifyAllManagersInCompany } from "../utils/notify.js";

/* ==========================================================
   🔧 HELPERS
========================================================== */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   📦 GET ALL PRODUCTS (Company + Manager)
========================================================== */
export const getCompanyProducts = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve company" });
    }

    const {
      category,
      active,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      shopId,
    } = req.query;

    const filters = { companyId };

    if (category) filters.category = category;
    if (active === "true") filters.isActive = true;
    if (active === "false") filters.isActive = false;
    if (search) filters.name = { $regex: search.trim(), $options: "i" };

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(filters);

    /* ------------------------------------------
       🏪 SHOP-SPECIFIC STOCK (OPTIONAL)
    ------------------------------------------ */
    if (shopId) {
      const branchStocks = await BranchStock.find({
        shopId,
        productId: { $in: products.map((p) => p._id) },
      }).lean();

      const stockMap = new Map(
        branchStocks.map((s) => [String(s.productId), s.quantity])
      );

      products.forEach((p) => {
        p.shopStock = stockMap.get(String(p._id)) ?? 0;
        p.isLowStock = p.shopStock <= (p.lowStockThreshold ?? 5);
      });
    } else {
      products.forEach((p) => {
        p.isLowStock = p.stock <= (p.lowStockThreshold ?? 5);
      });
    }

    res.json({
      ok: true,
      total,
      page: pageNum,
      limit: limitNum,
      products,
    });
  } catch (err) {
    console.error("❌ getCompanyProducts error:", err);
    res.status(500).json({ error: "Server error loading products" });
  }
};

/* ==========================================================
   📄 GET SINGLE PRODUCT
========================================================== */
export const getCompanyProduct = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, companyId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const branchStocks = await BranchStock.find({ productId: id })
      .populate("shopId", "name city")
      .lean();

    res.json({
      ok: true,
      product,
      branchStocks,
    });
  } catch (err) {
    console.error("❌ getCompanyProduct error:", err);
    res.status(500).json({ error: "Server error loading product" });
  }
};

/* ==========================================================
   ➕ CREATE PRODUCT (company only)
   ✔ Handles uploaded images (req.files)
========================================================== */
export const createCompanyProduct = async (req, res) => {
  try {
    const companyId = req.user._id;

    const {
      name,
      description = "",
      price,
      category = "",
      attributes = {},
      stock = 0,
      lowStockThreshold = 5,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    /* 📸 IMAGES FROM UPLOAD */
    const images =
      req.files?.map((f) => `/uploads/products/${f.filename}`) || [];

    const product = await Product.create({
      companyId,
      name,
      description,
      price: Number(price),
      category,
      attributes,
      images,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      stockHistory: [
        {
          change: Number(stock),
          reason: "Initial stock",
          userId: req.user._id,
        },
      ],
    });

    /* 🏪 INIT BRANCH STOCK = 0 */
    const shops = await Shop.find({ companyId, isActive: true }).select("_id");
    if (shops.length) {
      await BranchStock.insertMany(
        shops.map((s) => ({
          shopId: s._id,
          productId: product._id,
          quantity: 0,
        }))
      );
    }

    await notifyAllManagersInCompany(req, companyId, {
      type: "product",
      title: "New Product Added",
      message: `New product "${product.name}" added.`,
      actionUrl: "/manager/products",
      meta: { productId: product._id },
    });

    res.status(201).json({ ok: true, product });
  } catch (err) {
    console.error("❌ createCompanyProduct error:", err);
    res.status(500).json({ error: "Server error creating product" });
  }
};

/* ==========================================================
   ✏ UPDATE PRODUCT (company only)
========================================================== */
export const updateCompanyProduct = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, companyId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const {
      name,
      description,
      price,
      category,
      attributes,
      lowStockThreshold,
    } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category;
    if (attributes !== undefined) product.attributes = attributes;
    if (lowStockThreshold !== undefined) {
      product.lowStockThreshold = Number(lowStockThreshold);
    }

    /* 📸 APPEND NEW IMAGES IF UPLOADED */
    if (req.files?.length) {
      const newImages = req.files.map(
        (f) => `/uploads/products/${f.filename}`
      );
      product.images.push(...newImages);
    }

    await product.save();

    await notifyAllManagersInCompany(req, companyId, {
      type: "product",
      title: "Product Updated",
      message: `Product "${product.name}" was updated.`,
      actionUrl: "/manager/products",
      meta: { productId: product._id },
    });

    res.json({ ok: true, product });
  } catch (err) {
    console.error("❌ updateCompanyProduct error:", err);
    res.status(500).json({ error: "Server error updating product" });
  }
};

/* ==========================================================
   🔄 TOGGLE ACTIVE / INACTIVE
========================================================== */
export const toggleCompanyProductActive = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, companyId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    await notifyAllManagersInCompany(req, companyId, {
      type: "product",
      title: "Product Status Changed",
      message: `"${product.name}" is now ${
        product.isActive ? "ACTIVE" : "INACTIVE"
      }.`,
      actionUrl: "/manager/products",
    });

    res.json({ ok: true, product });
  } catch (err) {
    console.error("❌ toggleCompanyProductActive error:", err);
    res.status(500).json({ error: "Server error toggling product" });
  }
};

/* ==========================================================
   📦 ADJUST STOCK (Company-wide OR Per Shop)
========================================================== */
export const adjustCompanyProductStock = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { id } = req.params;
    const { amount, reason = "", shopId } = req.body;

    const delta = Number(amount);
    if (!delta) {
      return res.status(400).json({ error: "Stock amount must be non-zero" });
    }

    const product = await Product.findOne({ _id: id, companyId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    /* 🏪 SHOP STOCK */
    if (shopId) {
      const stock = await BranchStock.findOneAndUpdate(
        { shopId, productId: id },
        {
          $inc: { quantity: delta },
          $push: {
            history: {
              change: delta,
              reason,
              userId: req.user._id,
            },
          },
        },
        { new: true, upsert: true }
      );

      return res.json({
        ok: true,
        message: "Shop stock adjusted",
        shopStock: stock.quantity,
      });
    }

    /* 🏢 COMPANY STOCK */
    const prev = product.stock;
    product.stock += delta;

    product.stockHistory.push({
      change: delta,
      reason,
      userId: req.user._id,
    });

    await product.save();

    await notifyAllManagersInCompany(req, companyId, {
      type: "product",
      title: "Stock Updated",
      message: `Stock updated for "${product.name}" (${prev} → ${product.stock})`,
      actionUrl: "/manager/products",
    });

    res.json({ ok: true, product });
  } catch (err) {
    console.error("❌ adjustCompanyProductStock error:", err);
    res.status(500).json({ error: "Server error adjusting stock" });
  }
};
