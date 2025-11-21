// server/src/routes/companyProductRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getCompanyProducts } from "../controllers/companyProductController.js";

const router = Router();

/* ==========================================================
   📦 COMPANY PRODUCTS (Company + Manager)
   ========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("company", "manager"),
  getCompanyProducts
);

export default router;
