import express from "express";
import {
  sendManagerCompanyMessage,
  getManagerCompanyChatHistory,
} from "../controllers/chat/managerCompanyChatController.js";

// ⬅ FIXED: import protect instead of authMiddleware
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/chat/manager-company/send",
  protect,
  sendManagerCompanyMessage
);

router.get(
  "/chat/manager-company/:managerId",
  protect,
  getManagerCompanyChatHistory
);

export default router;
