import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  getCompanyManagers,
  createCompanyManagerProfile,
  updateCompanyManagerProfile,
  submitManagerVerification,
  verifyCompanyManager,
  rejectCompanyManager,
  createCompanyManagerAccount,
  toggleCompanyManagerStatus,
  listManagersForCompanyChat,
} from "../controllers/companyManagerController.js";

const router = Router();

/* ==========================================================
   📦 MULTER — MANAGER ID IMAGE UPLOAD
========================================================== */
const managerIdStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/managers/id";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `manager-${Date.now()}${ext}`);
  },
});

const uploadManagerId = multer({
  storage: managerIdStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ==========================================================
   🧑‍💼 COMPANY MANAGERS ROUTES
   Role: company
========================================================== */

/* 💬 CHAT — List managers for company chat */
router.get(
  "/manager/list",
  protect,
  authorizeRoles("company"),
  listManagersForCompanyChat
);

/* 📋 List all managers (admin / management view) */
router.get(
  "/",
  protect,
  authorizeRoles("company"),
  getCompanyManagers
);

/* ➕ Create manager profile (NO LOGIN) */
router.post(
  "/",
  protect,
  authorizeRoles("company"),
  createCompanyManagerProfile
);

/* ✏ Update manager basic info */
router.patch(
  "/:managerId/profile",
  protect,
  authorizeRoles("company"),
  updateCompanyManagerProfile
);

/* 🛂 Submit verification info (WITH FILE UPLOAD) */
router.patch(
  "/:managerId/verification",
  protect,
  authorizeRoles("company"),
  uploadManagerId.single("idImage"),
  submitManagerVerification
);

/* ✅ Verify manager */
router.patch(
  "/:managerId/verify",
  protect,
  authorizeRoles("company"),
  verifyCompanyManager
);

/* ❌ Reject manager */
router.patch(
  "/:managerId/reject",
  protect,
  authorizeRoles("company"),
  rejectCompanyManager
);

/* 🔐 Create manager login */
router.post(
  "/:managerId/create-account",
  protect,
  authorizeRoles("company"),
  createCompanyManagerAccount
);

/* 🔁 Activate / deactivate manager */
router.patch(
  "/:managerId/toggle",
  protect,
  authorizeRoles("company"),
  toggleCompanyManagerStatus
);

export default router;
