// server/src/controllers/companyProductController.js
import Product from "../models/Product.js";

const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role))
    return user.companyId;
  return null;
};

/* ==========================================================
   📦 GET ALL PRODUCTS FOR COMPANY (with filters)
   ========================================================== */
export const getCompanyProducts = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ error: "Unable to resolve companyId" });
    }

    const { status, name, category } = req.query;

    let filters = { companyId };

    // Filter by active/inactive
    if (status === "active") filters.isActive = true;
    if (status === "inactive") filters.isActive = false;

    // Filter by name
    if (name) {
      filters.name = { $regex: name, $options: "i" };
    }

    // Filter by category
    if (category) {
      filters.category = { $regex: category, $options: "i" };
    }

    const products = await Product.find(filters).sort({ createdAt: -1 });

    res.json({
      ok: true,
      count: products.length,
      products,
    });
  } catch (err) {
    console.error("❌ Error fetching company products:", err.message);
    res.status(500).json({ error: "Server error fetching products" });
  }
};
