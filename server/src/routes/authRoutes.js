// server/src/routes/authRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  register,
  login,
  superAdminCreateCompany,
  companyCreateUser,
} from "../controllers/authController.js";

const router = Router();

/* ==========================================================
   🔐 PUBLIC AUTH
========================================================== */
router.post("/register", register);
router.post("/login", login);

/* ==========================================================
   🟣 SUPERADMIN → CREATE COMPANY
========================================================== */
router.post(
  "/superadmin/create-company",
  protect,
  authorizeRoles("superadmin"),
  superAdminCreateCompany
);

/* ==========================================================
   🟠 COMPANY → CREATE MANAGER or DRIVER
========================================================== */
router.post(
  "/company/create-user",
  protect,
  authorizeRoles("company"),
  companyCreateUser
);

export default router;
