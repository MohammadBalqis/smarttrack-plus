// server/src/utils/notificationService.js
import Notification from "../models/Notification.js";

/**
 * Create a notification for a user
 * usage:
 * await createNotification({
 *   recipientId: managerId,
 *   companyId,
 *   type: "trip",
 *   message: "New trip assigned to Driver Ahmad",
 *   link: "/manager/trips",
 *   meta: { tripId, driverId }
 * });
 */
export const createNotification = async ({
  recipientId,
  companyId = null,
  type = "system",
  title = "",
  message,
  link = null,
  meta = {},
}) => {
  if (!recipientId || !message) return null;

  const notif = await Notification.create({
    recipientId,
    companyId,
    type,
    title,
    message,
    link,
    meta,
  });

  return notif;
};
