// server/src/controllers/managerNotificationController.js
import Notification from "../models/Notification.js";

/* ==========================================================
   🔔 GET NOTIFICATIONS FOR MANAGER / COMPANY / DRIVERS
========================================================== */
export const getManagerNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({
      userId,           // FIXED — your schema uses userId not recipientId
    })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      ok: true,
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    console.error("❌ getManagerNotifications error:", err.message);
    res.status(500).json({ error: "Server error fetching notifications" });
  }
};

/* ==========================================================
   🔔 MARK SINGLE NOTIFICATION AS READ
========================================================== */
export const markManagerNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notif = await Notification.findOne({
      _id: id,
      userId,
    });

    if (!notif) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notif.isRead = true;
    notif.readAt = new Date();
    await notif.save();

    res.json({
      ok: true,
      notification: notif,
    });
  } catch (err) {
    console.error("❌ markManagerNotificationAsRead error:", err.message);
    res.status(500).json({ error: "Server error updating notification" });
  }
};

/* ==========================================================
   🔔 MARK ALL NOTIFICATIONS AS READ
========================================================== */
export const markAllManagerNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({
      ok: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("❌ markAllManagerNotificationsAsRead error:", err.message);
    res.status(500).json({ error: "Server error updating notifications" });
  }
};

/* ==========================================================
   🗑️ CLEAR ALL NOTIFICATIONS
========================================================== */
export const clearManagerNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ userId });

    res.json({
      ok: true,
      message: "All notifications cleared",
    });
  } catch (err) {
    console.error("❌ clearManagerNotifications error:", err.message);
    res.status(500).json({ error: "Server error clearing notifications" });
  }
};
