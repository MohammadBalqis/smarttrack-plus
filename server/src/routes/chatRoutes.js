import express from "express";
import {
  sendManagerCompanyMessage,
  getManagerCompanyChatHistory,
} from "../controllers/chat/managerCompanyChatController.js";
import { listManagersForCompanyChat } from "../controllers/chat/managerCompanyChatListController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ===========================
   MANAGERS LIST (COMPANY)
=========================== */
router.get(
  "/manager/list-for-company",
  protect,
  authorizeRoles("company"),
  listManagersForCompanyChat
);

/* ===========================
   CHAT HISTORY
=========================== */
router.get(
  "/chat/manager-company/:managerId",
  protect,
  authorizeRoles("company", "manager"),
  getManagerCompanyChatHistory
);

/* ===========================
   SEND MESSAGE
=========================== */
router.post(
  "/chat/manager-company/send",
  protect,
  authorizeRoles("company", "manager"),
  sendManagerCompanyMessage
);

export default router;
