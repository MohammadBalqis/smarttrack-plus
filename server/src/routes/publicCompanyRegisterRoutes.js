import { Router } from "express";
import uploadCompanyDoc from "../middleware/uploadMiddleware.js";
import { submitCompanyApplication } from "../controllers/companyApplicationController.js";

const router = Router();

router.post(
  "/company/register",
  uploadCompanyDoc, // ✅ already single("document")
  submitCompanyApplication
);

export default router;
