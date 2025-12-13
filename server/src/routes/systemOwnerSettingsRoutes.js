import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getOwnerSettings,
  updateOwnerSettings,
} from "../controllers/systemOwner/systemOwnerSettingsController.js";

const router = Router();

/* ==========================================================
   SYSTEM OWNER SETTINGS
   Allowed roles: owner, superadmin
========================================================== */
const ownerAuth = [protect, authorizeRoles("owner", "superadmin")];

/* ================= SETTINGS ================= */
/* These map to:
   GET  /api/owner/settings
   PUT  /api/owner/settings
*/
router.get("/", ownerAuth, getOwnerSettings);
router.put("/", ownerAuth, updateOwnerSettings);

export default router;
