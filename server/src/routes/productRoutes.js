import { Router } from "express";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

/* ==========================================================
   🟢 CREATE PRODUCT (Company / Manager)
   ========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const { name, description, price } = req.body;

      if (!name || !price)
        return res.status(400).json({ error: "Name and price are required" });

      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const product = await Product.create({
        name,
        description,
        price,
        companyId,
      });

      res.status(201).json({
        ok: true,
        message: "Product added successfully",
        product,
      });
    } catch (err) {
      console.error("❌ Error creating product:", err.message);
      res.status(500).json({ error: "Server error creating product" });
    }
  }
);

/* ==========================================================
   📦 GET ALL PRODUCTS FOR COMPANY (internal dashboard)
   ========================================================== */
router.get(
  "/company-products",
  protect,
  authorizeRoles("company", "manager"),
  async (req, res) => {
    try {
      const companyId =
        req.user.role === "company" ? req.user._id : req.user.companyId;

      const products = await Product.find({ companyId }).sort({ createdAt: -1 });

      res.json({
        ok: true,
        count: products.length,
        products,
      });
    } catch (err) {
      console.error("❌ Error fetching products:", err.message);
      res.status(500).json({ error: "Server error fetching products" });
    }
  }
);

/* ==========================================================
   🛒 GET PRODUCTS FOR CUSTOMER
   ========================================================== */
router.get(
  "/customer-products",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      if (!req.user.companyId)
        return res
          .status(400)
          .json({ error: "Customer has not selected a company yet" });

      const products = await Product.find({
        companyId: req.user.companyId,
        isActive: true,
      }).sort({ createdAt: -1 });

      res.json({
        ok: true,
        count: products.length,
        products,
      });
    } catch (err) {
      console.error("❌ Error fetching customer products:", err.message);
      res.status(500).json({ error: "Server error fetching products" });
    }
  }
);

export default router;
