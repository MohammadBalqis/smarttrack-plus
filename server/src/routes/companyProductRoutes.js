// server/src/routes/companyProductRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  getCompanyProducts,
  getCompanyProduct,
  createCompanyProduct,
  updateCompanyProduct,
  toggleCompanyProductActive,
  adjustCompanyProductStock,
} from "../controllers/companyProductController.js";

/* ==========================================================
   📸 PRODUCT IMAGE UPLOAD CONFIG
========================================================== */
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/products";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const router = Router();

/* ==========================================================
   🔐 AUTH
========================================================== */
router.use(protect);

/* ==========================================================
   📦 LIST PRODUCTS
   GET /api/company/products
========================================================== */
router.get(
  "/",
  authorizeRoles("company", "manager"),
  getCompanyProducts
);

/* ==========================================================
   📄 SINGLE PRODUCT
   GET /api/company/products/:id
========================================================== */
router.get(
  "/:id",
  authorizeRoles("company", "manager"),
  getCompanyProduct
);

/* ==========================================================
   ➕ CREATE PRODUCT
   POST /api/company/products
========================================================== */
router.post(
  "/",
  authorizeRoles("company"),
  uploadProductImage.array("images", 5),
  createCompanyProduct
);

/* ==========================================================
   ✏ UPDATE PRODUCT
   PUT /api/company/products/:id
========================================================== */
router.put(
  "/:id",
  authorizeRoles("company"),
  uploadProductImage.array("images", 5),
  updateCompanyProduct
);

/* ==========================================================
   🔄 TOGGLE ACTIVE
   PATCH /api/company/products/:id/toggle
========================================================== */
router.patch(
  "/:id/toggle",
  authorizeRoles("company"),
  toggleCompanyProductActive
);

/* ==========================================================
   📦 ADJUST STOCK
   PATCH /api/company/products/:id/stock
========================================================== */
router.patch(
  "/:id/stock",
  authorizeRoles("company"),
  adjustCompanyProductStock
);

export default router;
