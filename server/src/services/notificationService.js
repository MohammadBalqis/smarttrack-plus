// server/src/services/notificationService.js
import Notification from "../models/Notification.js";

/* ==========================================================
   CENTRAL NOTIFICATION SERVICE (DB + SOCKET.IO)
========================================================== */

class NotificationService {
  static async send({
    userId,
    title,
    message,
    type = "general",
    category = "system",
    priority = "normal",
    meta = {},
    io = null,
  }) {
    if (!userId) return;

    const notif = await Notification.create({
      userId,
      title,
      message,
      type,        // trip, payment, driver, company, system
      category,    // success, warning, danger, info
      priority,    // low, normal, high, critical
      meta,        // any data you want frontend to use
    });

    // 🔵 Emit real-time
    if (io) {
      io.to(String(userId)).emit("notification:new", notif);
    }

    return notif;
  }

  static async bulkSend(userIds = [], data, io = null) {
    if (!Array.isArray(userIds)) return;

    const payload = userIds.map((uid) => ({
      userId: uid,
      ...data,
    }));

    const notifs = await Notification.insertMany(payload);

    if (io) {
      userIds.forEach((uid) => {
        const n = notifs.find((x) => x.userId.toString() === String(uid));
        if (n) io.to(String(uid)).emit("notification:new", n);
      });
    }

    return notifs;
  }
}

export default NotificationService;
