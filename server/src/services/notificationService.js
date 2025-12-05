import Notification from "../models/Notification.js";

export const sendNotification = async ({
  userId,
  companyId = null,
  title,
  message,
  type = "info",
  category = "system",
  actionUrl = null,
  icon = "Bell",
  priority = "normal",
  extraData = {},
  io, // socket instance
}) => {
  if (!userId) return;

  const notif = await Notification.create({
    userId,
    companyId,
    title,
    message,
    type,
    category,
    actionUrl,
    icon,
    priority,
    extraData,
  });

  if (io) {
    io.to(userId.toString()).emit("notification:new", notif);
  }

  return notif;
};
