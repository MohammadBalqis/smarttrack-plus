// server/src/controllers/managerProductController.js
import Product from "../models/Product.js";
import User from "../models/User.js";

/* ==========================================================
   Helper: resolve companyId (same logic used everywhere)
========================================================== */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role))
    return user.companyId;
  return null;
};

/* ==========================================================
   📦 1. GET ALL PRODUCTS (Manager View-Only)
   Supports:
   - category
   - isActive
   - search by name
   - price range
   - pagination
========================================================== */
export const getCompanyProducts = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

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

    if (category) filters.category = category;
    if (active === "true") filters.isActive = true;
    if (active === "false") filters.isActive = false;

    if (search) {
      filters.name = { $regex: search, $options: "i" };
    }

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Product.countDocuments(filters);

    const products = await Product.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      ok: true,
      total,
      page: Number(page),
      products,
    });
  } catch (err) {
    console.error("❌ getCompanyProducts error:", err.message);
    res.status(500).json({ error: "Server error loading products" });
  }
};

/* ==========================================================
   📌 2. GET SINGLE PRODUCT (Manager View-Only)
========================================================== */
export const getSingleProduct = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    const { id } = req.params;

    if (!companyId)
      return res.status(400).json({ error: "Unable to resolve companyId" });

    const product = await Product.findOne({
      _id: id,
      companyId,
    });

    if (!product)
      return res.status(404).json({ error: "Product not found" });

    res.json({
      ok: true,
      product,
    });
  } catch (err) {
    console.error("❌ getSingleProduct error:", err.message);
    res.status(500).json({ error: "Server error fetching product" });
  }
};

/* ==========================================================
   🚫 3. DISABLED FOR MANAGERS (Update)
========================================================== */
export const updateProduct = async (req, res) => {
  return res.status(403).json({
    error: "Managers cannot modify products",
  });
};

/* ==========================================================
   🚫 4. DISABLED FOR MANAGERS (Toggle)
========================================================== */
export const toggleProductActive = async (req, res) => {
  return res.status(403).json({
    error: "Managers cannot modify product activation state",
  });
};
