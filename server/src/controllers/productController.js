import Product from "../models/Product.js";

/* Helper to resolve companyId from user */
const resolveCompanyId = (user) => {
  if (!user) return null;
  if (user.role === "company") return user._id;
  if (["manager", "driver", "customer"].includes(user.role)) {
    return user.companyId;
  }
  return null;
};

/* ==========================================================
   🟢 CREATE PRODUCT
   ========================================================== */
export const createProduct = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Cannot detect company." });

    const {
      name,
      description,
      price,
      category = "general",
      attributes,
      productImage,
    } = req.body;

    if (!name || price == null) {
      return res
        .status(400)
        .json({ error: "Name and price are required fields." });
    }

    // Normalize attributes
    let finalAttributes = {};
    if (attributes) {
      try {
        finalAttributes =
          typeof attributes === "string"
            ? JSON.parse(attributes)
            : attributes;
      } catch {
        return res
          .status(400)
          .json({ error: "Invalid attributes format (must be JSON)." });
      }
    }

    const product = await Product.create({
      companyId,
      name,
      description,
      price,
      category,
      attributes: finalAttributes,
      productImage: productImage || null,
    });

    res.status(201).json({
      ok: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error("❌ createProduct error:", error);
    res.status(500).json({ error: "Server error creating product." });
  }
};

/* ==========================================================
   📦 GET ALL PRODUCTS FOR COMPANY
   ========================================================== */
export const getCompanyProducts = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Cannot detect company." });

    const products = await Product.find({ companyId }).sort({
      createdAt: -1,
    });

    res.json({
      ok: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("❌ getCompanyProducts error:", error);
    res.status(500).json({ error: "Server error fetching products." });
  }
};

/* ==========================================================
   🛒 GET PRODUCTS FOR CUSTOMER
   ========================================================== */
export const getCustomerProducts = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({
        error: "Customer has not selected a company yet.",
      });

    const products = await Product.find({
      companyId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      ok: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("❌ getCustomerProducts error:", error);
    res.status(500).json({ error: "Server error fetching products." });
  }
};

/* ==========================================================
   ✏️ UPDATE PRODUCT
   ========================================================== */
export const updateProduct = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Cannot detect company." });

    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.attributes) {
      try {
        updateData.attributes =
          typeof updateData.attributes === "string"
            ? JSON.parse(updateData.attributes)
            : updateData.attributes;
      } catch {
        return res
          .status(400)
          .json({ error: "Invalid attributes format (must be JSON)." });
      }
    }

    const updated = await Product.findOneAndUpdate(
      { _id: id, companyId },
      updateData,
      { new: true }
    );

    if (!updated)
      return res
        .status(404)
        .json({ error: "Product not found for this company." });

    res.json({
      ok: true,
      message: "Product updated successfully.",
      product: updated,
    });
  } catch (error) {
    console.error("❌ updateProduct error:", error);
    res.status(500).json({ error: "Server error updating product." });
  }
};

/* ==========================================================
   🔁 TOGGLE ACTIVE / INACTIVE
   ========================================================== */
export const toggleActiveProduct = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Cannot detect company." });

    const { id } = req.params;

    const product = await Product.findOne({ _id: id, companyId });
    if (!product)
      return res
        .status(404)
        .json({ error: "Product not found for this company." });

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      ok: true,
      message: `Product is now ${
        product.isActive ? "Active" : "Inactive"
      }.`,
      product,
    });
  } catch (error) {
    console.error("❌ toggleActiveProduct error:", error);
    res.status(500).json({ error: "Server error toggling product." });
  }
};

/* ==========================================================
   🗑 DELETE PRODUCT
   ========================================================== */
export const deleteProduct = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req.user);
    if (!companyId)
      return res.status(400).json({ error: "Cannot detect company." });

    const { id } = req.params;

    const deleted = await Product.findOneAndDelete({ _id: id, companyId });

    if (!deleted)
      return res
        .status(404)
        .json({ error: "Product not found for this company." });

    res.json({
      ok: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("❌ deleteProduct error:", error);
    res.status(500).json({ error: "Server error deleting product." });
  }
};
