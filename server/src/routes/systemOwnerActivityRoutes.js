import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getOwnerActivityLogs } from "../controllers/systemOwnerActivityController.js";

const router = Router();

/* ==========================================================
   SYSTEM OWNER ACTIVITY LOGS
   Allowed role: superadmin only
========================================================== */
const ownerAuth = [protect, authorizeRoles("superadmin")];

/* ================= ACTIVITY LOGS ================= */
/* Maps to:
   GET /api/owner/activity-logs
*/
router.get("/", ownerAuth, getOwnerActivityLogs);

export default router;
