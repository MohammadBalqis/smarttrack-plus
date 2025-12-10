// server/src/routes/systemOwnerSettingsRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getOwnerSettings,
  updateOwnerSettings,
} from "../controllers/systemOwner/systemOwnerSettingsController.js";

const router = Router();

/* ==========================================================
   All routes here are for SYSTEM OWNER
   Allowed roles: superadmin, owner
========================================================== */
const ownerAuth = [protect, authorizeRoles("superadmin", "owner")];

/* Load global settings */
router.get("/settings", ownerAuth, getOwnerSettings);

/* Update global settings */
router.put("/settings", ownerAuth, updateOwnerSettings);

export default router;
