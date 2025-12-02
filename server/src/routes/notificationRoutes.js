// server/src/routes/notificationRoutes.js
import { Router } from "express";
import Notification from "../models/Notification.js";
import GlobalSettings from "../models/GlobalSettings.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

/* ==========================================================
   📋 1. GET notifications (all roles)
   Filters + pagination + sorting
========================================================== */
router.get("/list", protect, async (req, res) => {
  try {
    const settings = await GlobalSettings.findOne();
    if (settings?.maintenanceMode && req.user.role !== "superadmin") {
      return res.status(503).json({
        ok: false,
        error: "System is under maintenance.",
      });
    }

    const {
      page = 1,
      limit = 20,
      status,
      type,
      category,
      priority,
    } = req.query;

    // 🔥 IMPORTANT: match your model field name
    const filter = { recipientId: req.user._id };

    if (status === "unread") filter.isRead = false;
    if (status === "read") filter.isRead = true;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
    ]);

    res.json({
      ok: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      notifications,
    });
  } catch (err) {
    console.error("❌ List notifications error:", err.message);
    res.status(500).json({
      error: "Server error loading notifications",
    });
  }
});

/* ==========================================================
   📌 2. MARK ONE NOTIFICATION AS READ
========================================================== */
router.patch("/mark-read/:id", protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notif)
      return res.status(404).json({ error: "Notification not found" });

    res.json({
      ok: true,
      message: "Notification marked as read",
      notif,
    });
  } catch (err) {
    console.error("❌ mark read error:", err.message);
    res.status(500).json({ error: "Server error marking as read" });
  }
});

/* ==========================================================
   📌 3. MARK ALL NOTIFICATIONS AS READ
========================================================== */
router.patch("/mark-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      ok: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("❌ Mark all read error:", err.message);
    res.status(500).json({ error: "Server error marking all" });
  }
});

/* ==========================================================
   🗑️ 4. DELETE ONE NOTIFICATION
========================================================== */
router.delete("/delete/:id", protect, async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipientId: req.user._id,
    });

    if (!deleted)
      return res.status(404).json({ error: "Notification not found" });

    res.json({
      ok: true,
      message: "Notification deleted",
    });
  } catch (err) {
    console.error("❌ Delete notification error:", err.message);
    res.status(500).json({ error: "Server error deleting" });
  }
});

/* ==========================================================
   🗑️ 5. DELETE ALL NOTIFICATIONS
========================================================== */
router.delete("/delete-all", protect, async (req, res) => {
  try {
    await Notification.deleteMany({ recipientId: req.user._id });

    res.json({
      ok: true,
      message: "All notifications deleted",
    });
  } catch (err) {
    console.error("❌ Delete all error:", err.message);
    res.status(500).json({ error: "Server error deleting all" });
  }
});

export default router;
