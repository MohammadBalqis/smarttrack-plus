// server/src/routes/managerProductRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getCompanyProducts,
  getSingleProduct,
} from "../controllers/managerProductController.js";

const router = Router();

// 📦 LIST ALL PRODUCTS (View-only)
router.get(
  "/products",
  protect,
  authorizeRoles("manager", "company"),
  getCompanyProducts
);

// 🔍 GET SINGLE PRODUCT (View-only)
router.get(
  "/product/:id",
  protect,
  authorizeRoles("manager", "company"),
  getSingleProduct
);

export default router;
