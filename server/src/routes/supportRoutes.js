// server/src/routes/supportRoutes.js
import express from "express";
import {
  sendSupportMessage,
  getCompanySupportMessages,
  updateSupportStatus,
} from "../controllers/support/customerSupportController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Customer sends ONE-WAY support message */
router.post("/customer/support", protect, sendSupportMessage);

/* Company / manager views all support messages of that company */
router.get(
  "/company/support/messages",
  protect,
  getCompanySupportMessages
);

/* Company / manager updates a message status */
router.patch(
  "/company/support/:id/status",
  protect,
  updateSupportStatus
);

export default router;
