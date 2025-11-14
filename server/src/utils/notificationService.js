// server/src/utils/notificationService.js
import Notification from "../models/Notification.js";
import { io } from "../../server.js";

/**
 * Core helper: create + emit notification to a single user
 *
 * Usage example:
 * await sendNotification({
 *   userId: customerId,
 *   title: "Driver Changed",
 *   message: "Your new driver is Mahmoud (white Kia, plate 123456).",
 *   type: "update",
 *   category: "customer",
 *   image: driver.profileImage,
 *   actionUrl: `/trips/${trip._id}`,
 *   priority: "high",
 *   extraData: {
 *     driver: {
 *       _id: driver._id,
 *       name: driver.name,
 *       email: driver.email,
 *       phone: driver.phone,
 *       profileImage: driver.profileImage,
 *     },
 *   },
 *   relatedTripId: trip._id,
 * });
 */
export const sendNotification = async ({
  userId,
  title,
  message,
  type = "system",
  category = "system",
  image = null,
  actionUrl = null,
  priority = "normal",
  sound = null,
  relatedTripId = null,
  extraData = {},
}) => {
  if (!userId || !title || !message) {
    throw new Error("userId, title and message are required for notification");
  }

  // 1) Save in DB
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    category,
    image,
    actionUrl,
    priority,
    sound,
    relatedTripId,
    extraData,
  });

  // 2) Real-time push via Socket.io (userId room)
  try {
    if (io) {
      io.to(userId.toString()).emit("notification:new", notification.toObject());
    }
  } catch (err) {
    console.error("⚠️ Socket.io emit error (notification:new):", err.message);
  }

  return notification;
};

/**
 * Optional helper: send to many users (e.g. all managers in a company)
 */
export const sendBulkNotification = async (notificationsPayload = []) => {
  const created = [];

  for (const payload of notificationsPayload) {
    const notif = await sendNotification(payload);
    created.push(notif);
  }

  return created;
};
