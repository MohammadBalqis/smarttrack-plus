// server/src/routes/managerProductRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getManagerProducts,
  getManagerProduct,
  getManagerGlobalProducts,
  addManagerProductFromCompany,
  updateManagerProduct,        // ✅ make sure this import exists
} from "../controllers/managerProductsController.js";

const router = Router();

/* ==========================================================
   📦 MANAGER SHOP PRODUCTS (LIST + DETAILS)
========================================================== */

// List products in this manager's shop
router.get(
  "/products",
  protect,
  authorizeRoles("manager", "company"),
  getManagerProducts
);

// Single product in this manager's shop
router.get(
  "/products/:productId",
  protect,
  authorizeRoles("manager", "company"),
  getManagerProduct
);

/* ==========================================================
   🏬 COMPANY GLOBAL CATALOG
========================================================== */
router.get(
  "/products/global",
  protect,
  authorizeRoles("manager", "company"),
  getManagerGlobalProducts
);

/* ==========================================================
   ➕ ADD PRODUCT FROM COMPANY CATALOG TO MANAGER SHOP
========================================================== */
router.post(
  "/products/add-from-company/:productId",
  protect,
  authorizeRoles("manager"),
  addManagerProductFromCompany
);

/* ==========================================================
   ✏️ UPDATE SHOP PRODUCT
========================================================== */
router.patch(
  "/products/:productId",
  protect,
  authorizeRoles("manager"),
  updateManagerProduct
);

export default router;
