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

/* List products (company + manager) */
router.get(
  "/products",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyProducts
);

/* Get single product (company + manager) */
router.get(
  "/products/:id",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyProduct
);

/* Create product (company only) */
router.post(
  "/products",
  protect,
  authorizeRoles("company"),
  createCompanyProduct
);

/* Update product (company only) */
router.put(
  "/products/:id",
  protect,
  authorizeRoles("company"),
  updateCompanyProduct
);

/* Toggle active (company only) */
router.put(
  "/products/:id/toggle",
  protect,
  authorizeRoles("company"),
  toggleCompanyProductActive
);

/* Adjust stock (company only) */
router.post(
  "/products/:id/stock",
  protect,
  authorizeRoles("company"),
  adjustCompanyProductStock
);

export default router;
