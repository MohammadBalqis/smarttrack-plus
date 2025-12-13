// server/src/routes/companySettingsRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getCompanyProfile,
  updateCompanyProfile,
  updateCompanyPassword,
  updateCompanyPreferences,
} from "../controllers/companySettingsController.js";
import { createCompanyShop } from "../controllers/companyShopController.js";

const router = Router();

// Only company role can access
router.use(protect, authorizeRoles("company"));

router.get("/profile", getCompanyProfile);
router.put("/profile", updateCompanyProfile);
router.put("/password", updateCompanyPassword);
router.put("/preferences", updateCompanyPreferences);

// 🆕 Add shop creation here
router.post("/create-shop", createCompanyShop);

export default router;
