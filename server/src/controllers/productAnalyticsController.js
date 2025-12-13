// server/src/controllers/productAnalyticsController.js
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import BranchStock from "../models/BranchStock.js";

/* ==========================================================
   📊 PRODUCT ANALYTICS (Company / Manager)
   - Sales
   - Revenue
   - Quantity sold
========================================================== */
export const getProductAnalytics = async (req, res) => {
  try {
    const companyId =
      req.user.role === "company" ? req.user._id : req.user.companyId;

    /* ------------------------------------------------------
       Aggregate order items
    ------------------------------------------------------ */
    const analytics = await Order.aggregate([
      { $match: { companyId } },

      { $unwind: "$items" },

      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.name" },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
        },
      },

      { $sort: { totalRevenue: -1 } },
    ]);

    res.json({
      ok: true,
      analytics,
    });
  } catch (err) {
    console.error("❌ Product analytics error:", err.message);
    res.status(500).json({
      error: "Server error loading product analytics",
    });
  }
};

/* ==========================================================
   📉 LOW STOCK ALERTS
   - Company-level
   - Branch-level
========================================================== */
export const getLowStockProducts = async (req, res) => {
  try {
    const companyId =
      req.user.role === "company" ? req.user._id : req.user.companyId;

    /* ------------------------------------------------------
       Company-wide low stock (no branches)
    ------------------------------------------------------ */
    const companyLowStock = await Product.find({
      companyId,
      stock: { $lte: 5 },
      isActive: true,
    }).select("name stock category");

    /* ------------------------------------------------------
       Branch-specific low stock
    ------------------------------------------------------ */
    const branchLowStock = await BranchStock.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      {
        $match: {
          "product.companyId": companyId,
          quantity: { $lte: 5 },
        },
      },

      {
        $project: {
          shopId: 1,
          productId: 1,
          quantity: 1,
          productName: "$product.name",
          category: "$product.category",
        },
      },
    ]);

    res.json({
      ok: true,
      companyLowStock,
      branchLowStock,
    });
  } catch (err) {
    console.error("❌ Low stock error:", err.message);
    res.status(500).json({
      error: "Server error loading low stock products",
    });
  }
};
