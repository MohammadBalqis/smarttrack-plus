import { Router } from "express";
import { submitCompanyApplication } from "../controllers/companyApplicationController.js";
import { uploadCompanyDoc } from "../middleware/uploadMiddleware.js";

const router = Router();

/**
 * PUBLIC route (no auth)
 */
router.post(
  "/register",
  uploadCompanyDoc, // ✅ correct middleware
  submitCompanyApplication
);

export default router;
