// server/src/utils/driverNotificationService.js
import DriverNotification from "../models/DriverNotification.js";
import { io } from "../../server.js";
import { logActivity } from "./activityLogger.js";

/**
 * Create a driver notification and push it via Socket.IO
 *
 * Example usage (in trip controller later):
 * await createDriverNotification({
 *   driverId,
 *   type: "TRIP_ASSIGNED",
 *   message: "New trip assigned to you",
 *   tripId: trip._id,
 * });
 */
export const createDriverNotification = async ({
  driverId,
  type,
  message,
  tripId = null,
  meta = {},
}) => {
  if (!driverId || !type || !message) {
    return null;
  }

  const notification = await DriverNotification.create({
    driverId,
    type,
    message,
    tripId,
  });

  // 🔔 Push to driver socket room
  io.to(`driver_${driverId}`).emit("driver:notification", {
    _id: notification._id,
    type: notification.type,
    message: notification.message,
    tripId: notification.tripId,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  });

  // 📝 Optional activity log
  await logActivity({
    userId: driverId,
    action: "DRIVER_NOTIFICATION_CREATED",
    description: `Notification: ${type}`,
    meta: {
      notificationId: notification._id,
      type,
      tripId,
      ...meta,
    },
  });

  return notification;
};
