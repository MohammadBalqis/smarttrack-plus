// server/src/routes/managerNotificationRoutes.js
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getManagerNotifications,
  markManagerNotificationAsRead,
  markAllManagerNotificationsAsRead,
} from "../controllers/managerNotificationController.js";

const router = Router();

/* ==========================================================
   🔔 MANAGER NOTIFICATIONS
   base: /api/manager/notifications
========================================================== */

// GET /api/manager/notifications
router.get(
  "/",
  protect,
  authorizeRoles("manager"),
  getManagerNotifications
);

// PATCH /api/manager/notifications/:id/read
router.patch(
  "/:id/read",
  protect,
  authorizeRoles("manager"),
  markManagerNotificationAsRead
);

// PATCH /api/manager/notifications/read-all
router.patch(
  "/read-all",
  protect,
  authorizeRoles("manager"),
  markAllManagerNotificationsAsRead
);

export default router;
