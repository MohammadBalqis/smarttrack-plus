import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import Notification from "../models/Notification.js";

const router = Router();

/* ==========================================================
   🔵 GET ALL CUSTOMER NOTIFICATIONS
========================================================== */
router.get(
  "/",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const notes = await Notification.find({
        userId: req.user._id,
      }).sort({ createdAt: -1 });

      res.json({ ok: true, notifications: notes });
    } catch (err) {
      console.error("❌ Error loading notifications:", err);
      res.status(500).json({ error: "Server error loading notifications" });
    }
  }
);

/* ==========================================================
   🟣 MARK AS READ
========================================================== */
router.patch(
  "/:id/read",
  protect,
  authorizeRoles("customer"),
  async (req, res) => {
    try {
      const note = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { read: true },
        { new: true }
      );

      res.json({ ok: true, notification: note });
    } catch (err) {
      console.error("❌ Error marking as read:", err);
      res.status(500).json({ error: "Failed to update notification" });
    }
  }
);

export default router;
