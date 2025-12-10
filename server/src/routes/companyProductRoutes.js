// server/src/routes/companyProductRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getCompanyProducts,
  getCompanyProduct,
  createCompanyProduct,
  updateCompanyProduct,
  toggleCompanyProductActive,
  adjustCompanyProductStock,
} from "../controllers/companyProductController.js";

const router = Router();

/* ==========================================================
   LIST PRODUCTS (company + manager)
========================================================== */
router.get(
  "/products",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyProducts
);

/* ==========================================================
   SINGLE PRODUCT (company + manager)
========================================================== */
router.get(
  "/products/:id",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyProduct
);

/* ==========================================================
   CREATE PRODUCT (company only)
========================================================== */
router.post(
  "/products",
  protect,
  authorizeRoles("company"),
  createCompanyProduct
);

/* ==========================================================
   UPDATE PRODUCT (company only)
========================================================== */
router.put(
  "/products/:id",
  protect,
  authorizeRoles("company"),
  updateCompanyProduct
);

/* ==========================================================
   TOGGLE ACTIVE (company only)
========================================================== */
router.put(
  "/products/:id/toggle",
  protect,
  authorizeRoles("company"),
  toggleCompanyProductActive
);

/* ==========================================================
   STOCK ADJUSTMENT (company only)
========================================================== */
router.post(
  "/products/:id/stock",
  protect,
  authorizeRoles("company"),
  adjustCompanyProductStock
);

export default router;
