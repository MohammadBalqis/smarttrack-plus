// server/src/routes/notificationRoutes.js
import { Router } from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

/* ==========================================================
   1️⃣ LIST NOTIFICATIONS (logged-in user)
   ==========================================================
GET /api/notifications
Query:
  page=1
  limit=20
  unreadOnly=true|false
  type=status|assignment|update|payment|system
  category=driver|manager|customer|company|owner|system
========================================================== */
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    let {
      page = 1,
      limit = 20,
      unreadOnly = "false",
      type,
      category,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId };

    if (unreadOnly === "true") filter.isRead = false;
    if (type) filter.type = type;
    if (category) filter.category = category;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      ok: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      notifications,
    });

  } catch (err) {
    console.error("❌ Get notifications error:", err.message);
    res.status(500).json({ error: "Server error loading notifications" });
  }
});

/* ==========================================================
   2️⃣ UNREAD COUNT
   ========================================================== */
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
   3️⃣ MARK ONE AS READ
   ========================================================== */
router.patch("/mark-read/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ ok: true, notification });

  } catch (err) {
    console.error("❌ Mark read error:", err.message);
    res.status(500).json({ error: "Server error updating notification" });
  }
});

/* ==========================================================
   4️⃣ MARK ALL AS READ
   ========================================================== */
router.patch("/mark-all-read", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      ok: true,
      modifiedCount: result.modifiedCount,
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("❌ Mark all read error:", err.message);
    res.status(500).json({ error: "Server error marking notifications" });
  }
});

/* ==========================================================
   5️⃣ DELETE NOTIFICATION
   ========================================================== */
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
