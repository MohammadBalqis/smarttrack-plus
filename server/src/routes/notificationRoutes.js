// server/src/routes/notificationRoutes.js
import { Router } from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

/* ==========================================================
   1️⃣ Get notifications for logged-in user
   ========================================================== */
/*
GET /api/notifications

Query:
  page        (default 1)
  limit       (default 20)
  unreadOnly  (true/false)
*/
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      unreadOnly = "false",
    } = req.query;

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const filter = { userId };

    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit),
    ]);

    res.json({
      ok: true,
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit),
      notifications,
    });
  } catch (err) {
    console.error("❌ Get notifications error:", err.message);
    res.status(500).json({ error: "Server error loading notifications" });
  }
});

/* ==========================================================
   2️⃣ Unread count (for badge)
   ========================================================== */
/*
GET /api/notifications/unread-count
*/
router.get("/unread-count", protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ ok: true, count });
  } catch (err) {
    console.error("❌ Unread count error:", err.message);
    res.status(500).json({ error: "Server error loading unread count" });
  }
});

/* ==========================================================
   3️⃣ Mark ONE notification as read
   ========================================================== */
/*
PATCH /api/notifications/mark-read/:id
*/
router.patch("/mark-read/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found",
      });
    }

    res.json({
      ok: true,
      notification,
    });
  } catch (err) {
    console.error("❌ Mark notification read error:", err.message);
    res.status(500).json({ error: "Server error updating notification" });
  }
});

/* ==========================================================
   4️⃣ Mark ALL notifications as read
   ========================================================== */
/*
PATCH /api/notifications/mark-all-read
*/
router.patch("/mark-all-read", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      ok: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("❌ Mark all read error:", err.message);
    res.status(500).json({ error: "Server error marking notifications" });
  }
});

/* ==========================================================
   5️⃣ Delete notification
   ========================================================== */
/*
DELETE /api/notifications/:id
*/
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        error: "Notification not found",
      });
    }

    res.json({
      ok: true,
      message: "Notification deleted",
    });
  } catch (err) {
    console.error("❌ Delete notification error:", err.message);
    res.status(500).json({ error: "Server error deleting notification" });
  }
});

export default router;
