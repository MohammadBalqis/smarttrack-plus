// server/src/routes/notificationRoutes.js
import { Router } from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// List notifications
router.get("/", protect, async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const filter = { userId: req.user._id };

  if (status === "unread") filter.isRead = false;
  if (status === "read") filter.isRead = true;

  const total = await Notification.countDocuments(filter);

  const data = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    ok: true,
    total,
    page: Number(page),
    notifications: data,
  });
});

// Mark one as read
router.patch("/:id/read", protect, async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );

  res.json({ ok: true, notif });
});

// Mark all as read
router.patch("/read-all", protect, async (req, res) => {
  await Notification.updateMany({ userId: req.user._id }, { isRead: true });
  res.json({ ok: true });
});

// Delete one
router.delete("/:id", protect, async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.json({ ok: true });
});

// Delete all
router.delete("/", protect, async (req, res) => {
  await Notification.deleteMany({ userId: req.user._id });
  res.json({ ok: true });
});

export default router;
