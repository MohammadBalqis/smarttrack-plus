// server/src/routes/sessionRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMySessions,
  revokeSession,
  revokeOtherSessions,
} from "../controllers/sessionController.js";

const router = Router();

// List all sessions for current user
router.get("/my", protect, getMySessions);

// Logout all other devices
router.post("/logout-others", protect, revokeOtherSessions);

// Revoke single session
router.delete("/:sessionId", protect, revokeSession);

export default router;
