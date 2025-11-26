import { Router } from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getCompanyBranding,
  updateCompanyBranding,
  uploadBrandingImage,
} from "../controllers/companyBrandingController.js";

const router = Router();

/* ==========================================================
   Multer File Upload (local for now, cloud later)
========================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

/* ==========================================================
   ROUTES
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("company"),
  getCompanyBranding
);

router.put(
  "/",
  protect,
  authorizeRoles("company"),
  updateCompanyBranding
);

router.post(
  "/upload",
  protect,
  authorizeRoles("company"),
  upload.single("file"),
  uploadBrandingImage
);

export default router;
