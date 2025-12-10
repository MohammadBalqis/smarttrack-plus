// server/src/utils/notificationService.js
import Notification from "../models/Notification.js";

/**
 * Create + (optionally) emit a notification to a single user.
 *
 * Usage from any controller:
 *   await createNotification(req, {
 *     recipientId: managerId,
 *     companyId,
 *     type: "trip",
 *     title: "New trip assigned",
 *     message: "Trip #123 was assigned to Driver Ahmad",
 *     link: "/manager/trips",
 *     meta: { tripId, driverId }
 *   });
 */
export const createNotification = async (
  req,
  {
    recipientId,
    companyId = null,
    type = "system",
    title = "",
    message,
    link = null,
    meta = {},
  }
) => {
  if (!recipientId || !message) return null;

  // 1️⃣ Save in DB
  const notif = await Notification.create({
    recipientId,
    companyId,
    type,
    title,
    message,
    link,
    meta,
  });

  // 2️⃣ Emit via socket.io if available
  try {
    const io = req.app.get("io");
    if (io && recipientId) {
      io.to(String(recipientId)).emit("notification:new", {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        link: notif.link,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
        meta: notif.meta,
      });
    }
  } catch (err) {
    console.error("⚠️ Socket emit failed (notification):", err.message);
  }

  return notif;
};

export default {
  createNotification,
};
