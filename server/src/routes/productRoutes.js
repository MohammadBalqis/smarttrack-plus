import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  createProduct,
  getCompanyProducts,
  getCustomerProducts,
  updateProduct,
  toggleActiveProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = Router();

/* ==========================================================
   🟢 CREATE PRODUCT (Company / Manager)
   ========================================================== */
router.post(
  "/create",
  protect,
  authorizeRoles("company", "manager"),
  createProduct
);

/* ==========================================================
   📦 GET ALL PRODUCTS FOR COMPANY
   ========================================================== */
router.get(
  "/company-products",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyProducts
);

/* ==========================================================
   🛒 GET PRODUCTS FOR CUSTOMER (active only)
   ========================================================== */
router.get(
  "/customer-products",
  protect,
  authorizeRoles("customer"),
  getCustomerProducts
);

/* ==========================================================
   ✏️ UPDATE PRODUCT (Company / Manager)
   ========================================================== */
router.put(
  "/:id",
  protect,
  authorizeRoles("company", "manager"),
  updateProduct
);

/* ==========================================================
   🔁 TOGGLE PRODUCT ACTIVE / INACTIVE
   ========================================================== */
router.patch(
  "/:id/toggle-active",
  protect,
  authorizeRoles("company", "manager"),
  toggleActiveProduct
);

/* ==========================================================
   🗑 DELETE PRODUCT (Company / Manager)
   ========================================================== */
router.delete(
  "/:id",
  protect,
  authorizeRoles("company", "manager"),
  deleteProduct
);

export default router;
