// server/src/utils/notificationEmitter.js
import NotificationService from "../services/notificationService.js";

export const notify = (req, {
    userId,
    title,
    message,
    type = "general",
    category = "info",
    priority = "normal",
    meta = {},
}) => {
  const io = req.app.get("io");

  return NotificationService.send({
    userId,
    title,
    message,
    type,
    category,
    priority,
    meta,
    io,
  });
};
