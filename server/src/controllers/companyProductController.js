// server/src/controllers/companyProductController.js
import Product from "../models/Product.js";

const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (user.role === "manager") return user.companyId;
  return null;
};

/* ==========================================================
   📦 GET ALL PRODUCTS (Company + Manager)
   Supports:
   - category
   - active (true/false)
   - search (name)
   - minPrice, maxPrice
   - page, limit
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
    } = req.query;

    const filters = { companyId };

    if (category) {
      filters.category = category;
    }

    if (active === "true") filters.isActive = true;
    if (active === "false") filters.isActive = false;

    if (search) {
      filters.name = { $regex: search.trim(), $options: "i" };
    }

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filters),
    ]);

    res.json({
      ok: true,
      total,
      page: pageNum,
      limit: limitNum,
      products,
    });
  } catch (err) {
    console.error("❌ getCompanyProducts error:", err.message);
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

    res.json({ ok: true, product });
  } catch (err) {
    console.error("❌ getCompanyProduct error:", err.message);
    res.status(500).json({ error: "Server error loading product" });
  }
};

/* ==========================================================
   ➕ CREATE PRODUCT (company owner only)
========================================================== */
export const createCompanyProduct = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ error: "Only company owners can create products" });
    }

    const companyId = req.user._id;

    const {
      name,
      description,
      price,
      category,
      attributes,
      images,
      stock,
      lowStockThreshold,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const product = await Product.create({
      companyId,
      name,
      description: description || "",
      price: Number(price),
      category: category || "general",
      attributes: attributes || {},
      images: Array.isArray(images) ? images : [],
      stock: stock !== undefined ? Number(stock) : 0,
      lowStockThreshold:
        lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
      stockHistory: [
        {
          change: stock ? Number(stock) : 0,
          reason: "Initial stock",
          createdAt: new Date(),
          userId: req.user._id,
        },
      ],
    });

    res.status(201).json({
      ok: true,
      message: "Product created",
      product,
    });
  } catch (err) {
    console.error("❌ createCompanyProduct error:", err.message);
    res.status(500).json({ error: "Server error creating product" });
  }
};

/* ==========================================================
   ✏️ UPDATE PRODUCT (company owner)
========================================================== */
export const updateCompanyProduct = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ error: "Only company owners can update products" });
    }

    const companyId = req.user._id;
    const { id } = req.params;

    const {
      name,
      description,
      price,
      category,
      attributes,
      images,
      stock,
      lowStockThreshold,
    } = req.body;

    const product = await Product.findOne({ _id: id, companyId });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category;
    if (attributes !== undefined) product.attributes = attributes;
    if (Array.isArray(images)) product.images = images;
    if (lowStockThreshold !== undefined)
      product.lowStockThreshold = Number(lowStockThreshold);

    // If stock is sent, treat it as absolute value
    if (stock !== undefined) {
      const prevStock = product.stock || 0;
      const newStock = Number(stock);
      const change = newStock - prevStock;

      product.stock = newStock;

      product.stockHistory.push({
        change,
        reason: "Manual stock update",
        createdAt: new Date(),
        userId: req.user._id,
      });
    }

    await product.save();

    res.json({
      ok: true,
      message: "Product updated",
      product,
    });
  } catch (err) {
    console.error("❌ updateCompanyProduct error:", err.message);
    res.status(500).json({ error: "Server error updating product" });
  }
};

/* ==========================================================
   🔄 TOGGLE ACTIVE / INACTIVE
========================================================== */
export const toggleCompanyProductActive = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ error: "Only company owners can update products" });
    }

    const companyId = req.user._id;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, companyId });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      ok: true,
      message: `Product is now ${product.isActive ? "active" : "inactive"}`,
      product,
    });
  } catch (err) {
    console.error("❌ toggleCompanyProductActive error:", err.message);
    res.status(500).json({ error: "Server error updating product status" });
  }
};

/* ==========================================================
   📦 ADJUST STOCK (change by +/- qty)
========================================================== */
export const adjustCompanyProductStock = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res
        .status(403)
        .json({ error: "Only company owners can adjust stock" });
    }

    const companyId = req.user._id;
    const { id } = req.params;
    const { change, reason } = req.body;

    const delta = Number(change);
    if (!delta) {
      return res.status(400).json({ error: "Stock change must be non-zero" });
    }

    const product = await Product.findOne({ _id: id, companyId });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.stock = (product.stock || 0) + delta;

    product.stockHistory.push({
      change: delta,
      reason: reason || "Stock adjustment",
      createdAt: new Date(),
      userId: req.user._id,
    });

    await product.save();

    res.json({
      ok: true,
      message: "Stock adjusted",
      product,
    });
  } catch (err) {
    console.error("❌ adjustCompanyProductStock error:", err.message);
    res.status(500).json({ error: "Server error adjusting stock" });
  }
};
